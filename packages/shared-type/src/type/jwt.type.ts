// Access Token Payload Type
export interface AccessTokenPayloadCreate {
  userId: number;
  roleId: number;
  roleName: string;
  /** ID của Session đang dùng — dùng để revoke / check token còn hiệu lực */
  sessionId: number;
}

export interface AccessTokenPayload extends AccessTokenPayloadCreate {
  iat: number;
  exp: number;
}

// Refresh Token Payload Type
export interface RefreshTokenPayloadCreate {
  userId: number;
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  iat: number;
  exp: number;
}
