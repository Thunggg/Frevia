import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { envConfig } from '../config/validate-env';

const aiDetails = (message: string, path = 'ai') => [{ message, path }];

export const AiServiceUnavailableException = () =>
  new ServiceUnavailableException(
    aiDetails(
      'Identity AI service is unavailable. Please try again later.',
      'ai',
    ),
  );

export const AiServiceTimeoutException = () =>
  new GatewayTimeoutException(
    aiDetails('Identity AI verification timed out. Please try again.', 'ai'),
  );

export const AiServiceFailedException = () =>
  new BadGatewayException(
    aiDetails('Identity AI verification failed. Please try again.', 'ai'),
  );

/** Kết quả của POST /verify/ (AI service) — contract giữ nguyên theo IDVerification. */
export type IdentityAiVerifyResult = {
  status?: string | null;
  rejection_reason?: string | null;
  face_match?: { match_score?: number | null; status?: string | null } | null;
  ocr?: { front?: { document_number?: string | null } | null } | null;
  qr?: { fields?: { document_number?: string | null } | null } | null;
  [key: string]: unknown;
};

export type IdentityAiPoseResult = {
  face_found: boolean;
  yaw: number | null;
  pitch: number | null;
  roll: number | null;
  blink?: boolean;
};

const toBlob = (file: Express.Multer.File) =>
  new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });

/**
 * Client HTTP tới dịch vụ AI xác minh CCCD (IDVerification/ai — FastAPI).
 * Frontend không bao giờ gọi AI trực tiếp; mọi traffic đều đi qua backend này.
 */
@Injectable()
export class IdentityAiService {
  private readonly baseUrl = envConfig.AI_SERVICE_URL.replace(/\/+$/, '');
  private readonly timeoutMs = envConfig.AI_SERVICE_TIMEOUT_MS;

  private async postForm<T>(
    path: string,
    form: FormData,
  ): Promise<T | undefined> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if ((error as Error)?.name === 'TimeoutError') {
        throw AiServiceTimeoutException();
      }
      throw AiServiceUnavailableException();
    }

    if (!response.ok) throw AiServiceFailedException();

    let payload: { result?: T } | T | null;
    try {
      payload = (await response.json()) as { result?: T } | T | null;
    } catch {
      throw AiServiceFailedException();
    }

    if (payload && typeof payload === 'object' && 'result' in payload) {
      return (payload as { result?: T }).result;
    }
    return payload as T | undefined;
  }

  /**
   * POST /liveness/pose — chấm 1 khung webcam (dùng trong lúc polling thử thách).
   */
  async livenessPose(file: Express.Multer.File): Promise<IdentityAiPoseResult> {
    const form = new FormData();
    form.append('file', toBlob(file), file.originalname || 'frame.jpg');
    const result = await this.postForm<IdentityAiPoseResult>(
      '/liveness/pose',
      form,
    );
    return {
      face_found: Boolean(result?.face_found),
      yaw: typeof result?.yaw === 'number' ? result.yaw : null,
      pitch: typeof result?.pitch === 'number' ? result.pitch : null,
      roll: typeof result?.roll === 'number' ? result.roll : null,
      blink: Boolean(result?.blink),
    };
  }

  /**
   * POST /verify/ — pipeline đầy đủ: OCR → QR → chất lượng ảnh → face match →
   * passive + active liveness → tamper → quyết định VERIFIED/REJECTED.
   */
  async verify(input: {
    front: Express.Multer.File;
    back?: Express.Multer.File;
    selfie: Express.Multer.File;
    liveness: Express.Multer.File[];
  }): Promise<IdentityAiVerifyResult> {
    const form = new FormData();
    form.append('front', toBlob(input.front), 'front.jpg');
    if (input.back) form.append('back', toBlob(input.back), 'back.jpg');
    form.append('selfie', toBlob(input.selfie), 'selfie.jpg');
    input.liveness.forEach((frame, index) => {
      form.append('liveness', toBlob(frame), `liveness_${index}.jpg`);
    });
    const result = await this.postForm<IdentityAiVerifyResult>(
      '/verify/',
      form,
    );
    return result ?? {};
  }
}
