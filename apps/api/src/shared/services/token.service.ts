import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
} from '@shared/types';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { envConfig } from '../config/validate-env';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  // Sign access Token
  async signAccessToken(payload: AccessTokenPayloadCreate): Promise<string> {
    return await this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: envConfig.ACCESS_TOKEN_SECRET,
        expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue,
      },
    );
  }

  // Sign refresh token
  async signRefreshToken(payload: RefreshTokenPayloadCreate): Promise<string> {
    return await this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: envConfig.REFRESH_TOKEN_SECRET,
        expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue,
      },
    );
  }

  // Verify Access Token
  async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
    return await this.jwtService.verifyAsync(accessToken, {
      secret: envConfig.ACCESS_TOKEN_SECRET,
    });
  }

  // Verify Refresh Token
  async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    return await this.jwtService.verifyAsync(refreshToken, {
      secret: envConfig.REFRESH_TOKEN_SECRET,
    });
  }
}
