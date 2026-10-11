import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_ROOT } from './routes/conversations/conversation-file.storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.NEXT_URL,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  // Phục vụ file upload (không nằm dưới global prefix /api)
  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads/' });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
