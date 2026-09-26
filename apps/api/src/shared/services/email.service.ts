import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@shared/types';
import nodemailer from 'nodemailer';
import { envConfig } from '../config/validate-env';
import { AppException } from '../exceptions/app.exception';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envConfig.EMAIL_USERNAME,
        pass: envConfig.EMAIL_PASSWORD,
      },
    });
  }

  async sendOTP({ email, code }: { email: string; code: string }) {
    try {
      const mainOptions = {
        from: envConfig.EMAIL_USERNAME,
        to: email,
        subject: 'Verify email',
        html: `<p>You have got a new message</b><ul><li>Username:${email}</li><li>Code:${code}</li></ul>`,
      };

      await this.transporter.sendMail(mainOptions);
    } catch (error: any) {
      console.log(error);

      throw new AppException(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error?.message as string,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
