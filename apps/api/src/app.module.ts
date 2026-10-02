// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './routes/auth/auth.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ApiResponseInterceptor } from './shared/interceptors/api-response.interceptor';
import { MyZodValidationPipe } from './shared/pipes/custom-zod-validation.pipes';
import { SharedModule } from './shared/shared.module';
import { ForumModule } from './routes/forums/forums-post/forums.module';
import { ForumLikeModule } from './routes/forums/forums-like/forums-like.module';
import { BrowseJobModule } from './routes/browse-job/browse-job.module';
import { ForumCommentModule } from './routes/forums/forums-comment/forums-comment.module';
import { ForumReportModule } from './routes/forums/forums-reports/forums-reports.module';
import { ManageJobModule } from './routes/manage-job/manage-job.module';
import { ForumAdminModule } from './routes/forums/forums-admin/forums-admin.module';
import { RolesModule } from './routes/roles/roles.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    ForumModule,
    ForumLikeModule,
    ForumCommentModule,
    ForumReportModule,
    BrowseJobModule,
    ManageJobModule,
    ForumAdminModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: MyZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
