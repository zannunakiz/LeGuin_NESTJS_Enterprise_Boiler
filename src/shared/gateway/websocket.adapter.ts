import { AllConfigType } from '@/config/config.type';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import { Server, ServerOptions } from 'ws';

export class WebSocketAdapter extends WsAdapter {
  readonly logger = new Logger(WebSocketAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService<AllConfigType>,
  ) {
    super(app);
  }

  create(port: number, options?: ServerOptions) {
    port = port || this.configService.get('app.websocketPort', { infer: true });
    options.verifyClient = async (info, done) => {
      // Perform authentication here.
      // console.log('Verifying websocket client', info?.req?.headers);
      return done(true);
    };

    const optionsWithCORS: ServerOptions = {
      ...options,
    };
    return new Server({ port, ...optionsWithCORS });
  }
}
