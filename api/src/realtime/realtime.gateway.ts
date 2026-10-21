import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveEvent } from './live-event';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const raw: unknown = client.handshake.auth?.['token'];
    const token = typeof raw === 'string' ? raw : undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      this.jwt.verify(token);
    } catch {
      this.logger.debug('Rejected a live connection with an invalid token');
      client.disconnect();
    }
  }

  broadcast<T>(event: string, payload: LiveEvent<T>) {
    this.server?.emit(event, payload);
  }
}
