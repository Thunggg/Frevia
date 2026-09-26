// Access Token Payload Type
export interface AccessTokenPayloadCreate {
  userId: number;
  roleId: number;
  roleName: string;
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
