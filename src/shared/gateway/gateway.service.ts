import { Logger, NotFoundException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'net';
import { Server, WebSocket } from 'ws';
import { CacheService } from '../cache/cache.service';

@WebSocketGateway()
export class GatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private clients: Map<string, WebSocket>; // <userId> -> WebSocket

  constructor(private readonly cacheService: CacheService) {
    this.clients = new Map();
  }

  private readonly logger = new Logger(GatewayService.name);
  @WebSocketServer() server: Server;

  afterInit(): void {
    this.logger.log(`Websocket gateway initialized.`);
  }

  /**
   * When a new client connects to the WebSocket server, the handleConnection method defined in the OnGatewayConnection interface is called.
   * @param {WebSocket} client - the client socket
   */
  async handleConnection(client: WebSocket, req: Request) {
    const socket = client?.['_socket'] as Socket;
    // Perform your own id mapping logic here
    const url = req?.url;
    const search = new URLSearchParams(
      url?.startsWith('/') ? url?.slice(1) : url,
    );
    const userId = search?.get('userId');
    if (!userId) {
      throw new NotFoundException('User id not found.');
    }
    this.logger.log(`User id ${userId} connected`);
    this.clients.set(userId, client);
    const remoteUsers = await this.cacheService.get<string[] | undefined>({
      key: socket?.remoteAddress,
    });
    const users = new Set<string>(Array.from(remoteUsers ?? []));
    users.add(userId);
    await this.cacheService.set(
      { key: socket?.remoteAddress },
      Array.from(users),
      { ttl: 1000 },
    );
    this.sendTo(userId, 'message', { success: true });
  }

  async handleDisconnect(client: WebSocket) {
    this.logger.log(`Client disconnected.`);
    const socket = client?.['_socket'] as Socket;
    const remoteUsers = await this.cacheService.get<string[] | undefined>({
      key: socket?.remoteAddress,
    });

    if (remoteUsers && Array.isArray(remoteUsers)) {
      for (const user of remoteUsers) {
        const client = this.clients.get(user);
        if (client) {
          this.sendTo(user, 'RECONNECT');
          this.clients.delete(user);
        }
      }
    }

    this.cacheService.delete({ key: socket?.remoteAddress });
  }

  /**
   * Send event to specific client. One user can be multiple clients in multiple devices.
   * @param userId - userId to whom to emit event.
   * @param event - event name
   * @param payload - data to emit.
   */
  sendTo(userId: string, event: string, data?: any): void {
    const client = this.clients.get(userId);
    if (client) {
      client.send(
        JSON.stringify({
          event: event,
          data,
        }),
      );
    }
  }

  /**
   * Send an event with a payload to all connected clients.
   * @param {string} event - the name of the event to emit
   * @param {any} data - the data to send with the event
   */
  sendToAll(event: string, data: any) {
    for (const client of this.server.clients) {
      client.send(
        JSON.stringify({
          event,
          data,
        }),
      );
    }
  }

  /**
   * Listen client's message in this  connection
   * @param socket - client socket who sends messages to this connection
   * @param data - data sent to socket server
   */
  @SubscribeMessage('message')
  handleMessage(socket: WebSocket, data: unknown) {
    this.logger.log(
      `Received message from client: `,
      JSON.stringify(data, null, 2),
    );
  }

  @SubscribeMessage('ping')
  async handlePing(socket: WebSocket) {
    socket.send('pong');
  }
}
