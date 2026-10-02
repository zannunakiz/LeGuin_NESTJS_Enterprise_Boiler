import { Logger } from '@nestjs/common';
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

@WebSocketGateway()
export class GatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}

  private readonly logger = new Logger(GatewayService.name);
  @WebSocketServer() server: Server;

  afterInit(): void {
    this.logger.log(`Websocket gateway initialized.`);
  }

  private _getConnectedSocketClient(client: WebSocket): Socket {
    return client['_socket'];
  }

  /**
   * When a new client connects to the WebSocket server, the handleConnection method defined in the OnGatewayConnection interface is called.
   * @param client - the client socket
   */
  async handleConnection(client: WebSocket) {
    const _socket = this._getConnectedSocketClient(client);
    // eslint-disable-next-line no-console
    console.log('New client connected.');
  }

  async handleDisconnect(client: WebSocket) {
    const _socket = this._getConnectedSocketClient(client);
    // eslint-disable-next-line no-console
    console.log('Client disconnected');
  }

  /**
   * Emit event to specific client. One user can be multiple clients in multiple devices.
   * @param userId - userId to whom to emit event.
   * @param event - event name
   * @param payload - data to emit.
   */
  emitTo(userId: string, event: string, payload: any): void {
    const clients = this._findClientsByUserId(userId);
    for (const client of clients) {
      client.send(
        JSON.stringify({
          eventName: event,
          message: payload,
        }),
      );
    }
  }

  /**
   * Emits an event with a payload to all connected clients.
   * @param {string} event - the name of the event to emit
   * @param {any} payload - the data to send with the event
   */
  emitToAll<T>(event: string, payload: T) {
    for (const client of this.server.clients) {
      client.send(
        JSON.stringify({
          eventName: event,
          message: payload,
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
    const _client = this._getConnectedSocketClient(socket);
    // eslint-disable-next-line no-console
    console.log(`Received message from client: `, data);
  }

  @SubscribeMessage('ping')
  async handlePing(socket: WebSocket) {
    socket.send('pong');
  }

  /**
   * Finds all WebSocket clients connected to the server with the specified userId.
   * @param {string} userId - The userId to search for.
   * @returns {WebSocket[]} An array of WebSocket clients with the specified userId.
   */
  private _findClientsByUserId(userId: string): WebSocket[] {
    const userIdToClients = new Map<string, WebSocket[]>();
    // Build a Map of clients by their userId
    if (Symbol.iterator in Object(this.server?.clients)) {
      for (const socket of this.server.clients) {
        const socketUserId = socket['_socket']?.userId;
        if (!userIdToClients.has(socketUserId)) {
          userIdToClients.set(socketUserId, []);
        }
        userIdToClients.get(socketUserId)?.push(socket);
      }
    }
    const clients: WebSocket[] = [];
    // Retrieve the clients with the specified userId
    const matchingClients = userIdToClients.get(userId);
    if (matchingClients) {
      clients.push(...matchingClients);
    }
    return clients;
  }
}
