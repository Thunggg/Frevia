import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { envConfig } from '../config/validate-env';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: envConfig.EMAIL_USERNAME,
        pass: envConfig.EMAIL_PASSWORD,
      },
    });
  }

  async sendOTP({ email, code }: { email: string; code: string }) {
    try {
      const mainOptions = {
        from: 'Frevia Team',
        to: email,
        subject: 'Verify email',
        html: `<p>You have got a new message</b><ul><li>Username:${email}</li><li>Code:${code}</li></ul>`,
      };

      await this.transporter.sendMail(mainOptions);
    } catch (error: any) {
      console.log(error);

      throw new InternalServerErrorException([
        { message: error?.message, path: 'email' },
      ]);
    }
  }
}
