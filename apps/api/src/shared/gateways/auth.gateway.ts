import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { envConfig } from '../config/validate-env';
import { TokenService } from '../services/token.service';

type SocketUserData = {
  userId: number;
  sessionId?: number;
};

export const AUTH_SOCKET_EVENTS = {
  FORCE_LOGOUT: 'AUTH_FORCE_LOGOUT',
} as const;

export type ForceLogoutPayload = {
  reason: string;
  type: 'BAN' | 'SESSION_REVOKED';
};

@Injectable()
@WebSocketGateway({
  namespace: 'auth',
  cors: {
    origin: envConfig.NEXT_URL,
    credentials: true,
  },
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuthGateway.name);

  constructor(private readonly tokenService: TokenService) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token;
      const headerToken =
        client.handshake.headers?.authorization?.split(' ')[1];
      const token: string | undefined =
        typeof authToken === 'string' ? authToken : headerToken;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.tokenService.verifyAccessToken(token);
      client.data = {
        userId: payload.userId,
        sessionId: payload.sessionId,
      } as SocketUserData;

      await client.join(`user:${payload.userId}`);

      if (payload.sessionId) {
        await client.join(`session:${payload.sessionId}`);
      }

      this.logger.log(
        `Auth socket connected: userId=${payload.userId}, sessionId=${payload.sessionId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Auth socket connection rejected: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const data = client.data as SocketUserData | undefined;
    this.logger.log(
      `Auth socket disconnected: userId=${data?.userId ?? 'unknown'}, sessionId=${data?.sessionId ?? 'unknown'}`,
    );
  }

  emitForceLogoutUser(userId: number, reason: string) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(AUTH_SOCKET_EVENTS.FORCE_LOGOUT, {
      reason,
      type: 'BAN',
    } satisfies ForceLogoutPayload);
    this.logger.log(`Emitted FORCE_LOGOUT to user:${userId} (BAN)`);
  }

  emitForceLogoutSession(sessionId: number, reason: string) {
    if (!this.server) return;
    this.server
      .to(`session:${sessionId}`)
      .emit(AUTH_SOCKET_EVENTS.FORCE_LOGOUT, {
        reason,
        type: 'SESSION_REVOKED',
      } satisfies ForceLogoutPayload);
    this.logger.log(`Emitted FORCE_LOGOUT to session:${sessionId} (REVOKED)`);
  }
}

