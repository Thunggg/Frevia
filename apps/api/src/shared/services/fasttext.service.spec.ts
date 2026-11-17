import { FastTextService } from './fasttext.service';

describe('FastTextService', () => {
  let service: FastTextService;

  beforeEach(() => {
    service = new FastTextService();
  });

  describe('isEnglish', () => {
    it('detects English text correctly', async () => {
      const isEn = await service.isEnglish(
        'Looking for a Senior Full Stack Engineer with React and NestJS experience',
      );
      expect(isEn).toBe(true);
    });

    it('rejects Vietnamese with diacritics', async () => {
      const isEn = await service.isEnglish(
        'Tuyển lập trình viên backend có kinh nghiệm làm việc thực tế',
      );
      expect(isEn).toBe(false);
    });

    it('rejects Vietnamese without diacritics', async () => {
      const isEn = await service.isEnglish(
        'Tuyen lap trinh vien backend co kinh nghiem lam viec thuc te',
      );
      expect(isEn).toBe(false);
    });

    it('rejects French and other languages', async () => {
      const isEn = await service.isEnglish(
        'Je cherche un developpeur web pour creer un site ecommerce',
      );
      expect(isEn).toBe(false);
    });

    it('handles HTML formatted English descriptions', async () => {
      const isEn = await service.isEnglish(
        '<p>We are seeking a <strong>talented software engineer</strong>.</p><ul><li>3 years experience</li></ul>',
      );
      expect(isEn).toBe(true);
    });
  });

  describe('detect', () => {
    it('returns language code', async () => {
      const langEn = await service.detect('This is an English job description');
      expect(langEn).toBe('en');

      const langVi = await service.detect(
        'Đây là mô tả công việc bằng tiếng Việt',
      );
      expect(langVi).toBe('vi');
    });
  });
});
