process.env.PORT = process.env.PORT || '3000';
process.env.DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres:postgres@localhost:5432/test';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.OTP_EXPIRES_IN = process.env.OTP_EXPIRES_IN || '5m';
process.env.OTP_ATTEMPT_WINDOW = process.env.OTP_ATTEMPT_WINDOW || '15m';
process.env.EMAIL_USERNAME = process.env.EMAIL_USERNAME || 'test@example.com';
process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'testpassword';
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'test_access_token_secret_123456';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test_refresh_token_secret_123456';
process.env.ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || '1h';
process.env.REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || '1d';
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || 'dummy_google_client_id';
process.env.GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_client_secret';
process.env.GOOGLE_REDIRECT_URL =
  process.env.GOOGLE_REDIRECT_URL ||
  'http://localhost:3000/api/auth/google/callback';
process.env.NEXT_URL = process.env.NEXT_URL || 'http://localhost:3001';
process.env.CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || 'test_cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '123456789';
process.env.CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || 'test_api_secret';
