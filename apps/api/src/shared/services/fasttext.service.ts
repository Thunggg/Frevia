import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FastText } from 'fasttext.wasm';

@Injectable()
export class FastTextService implements OnModuleInit {
  private readonly logger = new Logger(FastTextService.name);
  private fastTextInstance: FastText | null = null;
  private initPromise: Promise<FastText> | null = null;

  async onModuleInit(): Promise<void> {
    try {
      await this.getInstance();
      this.logger.log('FastText language detection model loaded successfully.');
    } catch (error) {
      this.logger.warn('Failed to pre-load FastText model on startup', error);
    }
  }

  private async getInstance(): Promise<FastText> {
    if (this.fastTextInstance) {
      return this.fastTextInstance;
    }
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const ft = await FastText.create();
        await ft.loadModel();
        this.fastTextInstance = ft;
        return ft;
      })();
    }
    return this.initPromise;
  }

  /**
   * Helper to strip HTML tags and non-letter noise before language detection
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/[0-9]+/g, ' ')
      .replace(/[^\p{L}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check for Vietnamese accented characters
   */
  private hasVietnameseDiacritics(text: string): boolean {
    return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      text,
    );
  }

  /**
   * Detect language code using FastText.
   */
  async detect(text: string): Promise<string> {
    const cleaned = this.cleanText(text);
    if (!cleaned) return 'unknown';

    if (this.hasVietnameseDiacritics(text)) {
      return 'vi';
    }

    try {
      const ft = await this.getInstance();
      const detected = ft.detect(cleaned);
      return detected || 'unknown';
    } catch (error) {
      this.logger.error('FastText detect error:', error);
      return 'unknown';
    }
  }

  /**
   * Check whether text is written in English.
   */
  async isEnglish(text: string): Promise<boolean> {
    const cleaned = this.cleanText(text);
    if (!cleaned) return false;

    // Any Vietnamese diacritics -> not English
    if (this.hasVietnameseDiacritics(text)) {
      return false;
    }

    try {
      const ft = await this.getInstance();
      const predictions = ft.predict(cleaned, 3);
      const topLabel = predictions.keys().next().value as string | undefined;

      if (topLabel === '__label__en') {
        return true;
      }

      const lang = ft.detect(cleaned);
      return lang === 'en';
    } catch (error) {
      this.logger.error('FastText isEnglish error:', error);
      return /^[a-zA-Z\s.,!?'"()\-:;0-9]+$/.test(cleaned);
    }
  }
}
