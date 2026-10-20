import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
import { ProfileRepository } from './profile.repo';
import { ProfileService } from './profile.service';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { AiCvAnalyzerService } from '../../shared/services/ai-cv-analyzer.service';
import { SkillResolverService } from '../../shared/services/skill-resolver.service';
import {
  CvFileInvalidException,
  CvFileRequiredException,
  CvNotFoundException,
} from './profile.error';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const freelancerProfile = ({
  userId = 10,
  cvUrl = null,
  cvPublicId = null,
  cvFileName = null,
}: {
  userId?: number;
  cvUrl?: string | null;
  cvPublicId?: string | null;
  cvFileName?: string | null;
} = {}) => ({
  id: 5,
  userId,
  freelancerProfile: { cvUrl, cvPublicId, cvFileName },
  user: {
    userRoles: [{ role: { name: RoleName.FREELANCER } }],
  },
});

const pdfFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    buffer: Buffer.from('%PDF-1.4\nfake pdf content'),
    mimetype: 'application/pdf',
    size: 1000,
    originalname: 'resume.pdf',
    ...overrides,
  }) as Express.Multer.File;

describe('ProfileService CV', () => {
  let repository: {
    findFreelancerProfileById: jest.Mock;
    updateCv: jest.Mock;
    findSkillsByProfileId: jest.Mock;
  };
  let cloudinary: {
    isConfigured: jest.Mock;
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
  };
  let cvAnalyzer: {
    extractSkills: jest.Mock;
  };
  let skillResolver: {
    resolveSkills: jest.Mock;
    resolveSkillEntries: jest.Mock;
  };
  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      findFreelancerProfileById: jest.fn(),
      updateCv: jest.fn(),
      findSkillsByProfileId: jest.fn().mockResolvedValue([]),
    };
    cloudinary = {
      isConfigured: jest.fn().mockReturnValue(false),
      uploadFile: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    cvAnalyzer = {
      extractSkills: jest.fn(),
    };
    skillResolver = {
      resolveSkills: jest.fn().mockResolvedValue([]),
      resolveSkillEntries: jest.fn().mockResolvedValue([]),
    };
    service = new ProfileService(
      repository as unknown as ProfileRepository,
      cloudinary as unknown as CloudinaryService,
      cvAnalyzer as unknown as AiCvAnalyzerService,
      skillResolver as unknown as SkillResolverService,
    );
  });

  describe('uploadCv', () => {
    it('rejects the upload when no file is provided', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(service.uploadCv(5, 10, undefined)).rejects.toEqual(
        CvFileRequiredException(),
      );
    });

    it('rejects a non-PDF file even when the mimetype is claimed as PDF', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(
        service.uploadCv(
          5,
          10,
          pdfFile({ buffer: Buffer.from('not a pdf at all') }),
        ),
      ).rejects.toEqual(CvFileInvalidException());
    });

    it('rejects a file larger than 10 MB', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(
        service.uploadCv(5, 10, pdfFile({ size: 11 * 1024 * 1024 })),
      ).rejects.toEqual(CvFileInvalidException());
    });

    it('rejects uploading to a profile owned by another user', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ userId: 10 }),
      );

      await expect(service.uploadCv(5, 99, pdfFile())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.updateCv).not.toHaveBeenCalled();
    });

    it('falls back to local storage when Cloudinary is not configured', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );
      repository.updateCv.mockResolvedValue({
        cvUrl: 'local://cvs/10/some-uuid.pdf',
        cvFileName: 'resume.pdf',
      });

      const result = await service.uploadCv(5, 10, pdfFile());

      const saved = repository.updateCv.mock.calls[0][1] as {
        cvUrl: string;
        cvFileName: string;
        cvPublicId: string | null;
      };
      expect(saved.cvUrl).toMatch(/^local:\/\/cvs\/10\/[0-9a-f-]+\.pdf$/);
      expect(saved.cvFileName).toBe('resume.pdf');
      expect(saved.cvPublicId).toBeNull();
      expect(result).toEqual({
        cvUrl: '/api/backend/profiles/5/cv/file',
        cvFileName: 'resume.pdf',
      });
    });

    it('uploads to Cloudinary and deletes the replaced file when configured', async () => {
      cloudinary.isConfigured.mockReturnValue(true);
      cloudinary.uploadFile.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/example/frevia/cvs/10/new.pdf',
        public_id: 'frevia/cvs/10/new',
      });
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvPublicId: 'frevia/cvs/10/old' }),
      );
      repository.updateCv.mockResolvedValue({
        cvUrl: 'https://res.cloudinary.com/example/frevia/cvs/10/new.pdf',
        cvFileName: 'resume.pdf',
      });

      const result = await service.uploadCv(5, 10, pdfFile());

      expect(cloudinary.uploadFile).toHaveBeenCalledWith(
        expect.anything(),
        'frevia/cvs/10',
      );
      expect(cloudinary.deleteFile).toHaveBeenCalledWith('frevia/cvs/10/old');
      expect(result.cvUrl).toBe(
        'https://res.cloudinary.com/example/frevia/cvs/10/new.pdf',
      );
    });
  });

  describe('getCvFile', () => {
    it('throws when the profile has no CV', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(service.getCvFile(5, 10)).rejects.toEqual(
        CvNotFoundException(),
      );
    });

    it('returns the remote URL for a Cloudinary-stored CV', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'https://res.cloudinary.com/example/frevia/cvs/10/cv.pdf',
          cvFileName: 'resume.pdf',
        }),
      );

      await expect(service.getCvFile(5, 10)).resolves.toEqual({
        remoteUrl: 'https://res.cloudinary.com/example/frevia/cvs/10/cv.pdf',
        fileName: 'resume.pdf',
      });
    });

    it('resolves the local absolute path for a locally stored CV', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'local://cvs/10/some-uuid.pdf',
          cvFileName: 'resume.pdf',
        }),
      );

      const result = await service.getCvFile(5, 10);

      expect(result.absolutePath).toContain('uploads');
      expect(result.absolutePath?.endsWith('cvs\\10\\some-uuid.pdf')).toBe(
        true,
      );
      expect(result.fileName).toBe('resume.pdf');
    });

    it('blocks path traversal attempts in the stored CV path', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'local://../../secrets/env.pdf',
        }),
      );

      await expect(service.getCvFile(5, 10)).rejects.toEqual(
        CvNotFoundException(),
      );
    });
  });

  describe('analyzeCv', () => {
    it('throws when the profile has no CV', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(service.analyzeCv(5, 10)).rejects.toEqual(
        CvNotFoundException(),
      );
      expect(cvAnalyzer.extractSkills).not.toHaveBeenCalled();
    });

    it('maps AI-extracted skills to catalog names and drops existing ones', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'https://cdn.example.com/cv.pdf',
          cvFileName: 'resume.pdf',
        }),
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from('%PDF-fake'),
      }) as unknown as typeof fetch;
      cvAnalyzer.extractSkills.mockResolvedValue([
        { name: 'js', proficiencyLevel: 8 },
        { name: 'PostgreSQL', proficiencyLevel: 7 },
        { name: 'Standalone AI Skill', proficiencyLevel: 4 },
      ]);
      skillResolver.resolveSkillEntries.mockResolvedValue([
        { name: 'js', skill: { id: 1, name: 'javascript', slug: 'javascript' } },
        { name: 'PostgreSQL', skill: { id: 2, name: 'PostgreSQL', slug: 'postgresql' } },
        { name: 'Standalone AI Skill', skill: null },
      ]);
      repository.findSkillsByProfileId.mockResolvedValue([
        {
          id: 99,
          freelancerProfileId: 5,
          skillId: 2,
          proficiencyLevel: 7,
          skill: { id: 2, name: 'PostgreSQL' },
        },
      ]);

      await expect(service.analyzeCv(5, 10)).resolves.toEqual({
        suggestions: [
          { skillName: 'javascript', proficiencyLevel: 8 },
          { skillName: 'Standalone AI Skill', proficiencyLevel: 4 },
        ],
      });
      expect(cvAnalyzer.extractSkills).toHaveBeenCalledWith(
        expect.any(Buffer),
        'resume.pdf',
      );
    });

    it('throws a service-unavailable exception when the AI call fails', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'https://cdn.example.com/cv.pdf',
        }),
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from('%PDF-fake'),
      }) as unknown as typeof fetch;
      cvAnalyzer.extractSkills.mockRejectedValue(
        new Error('AI CV analysis service is unreachable.'),
      );

      await expect(service.analyzeCv(5, 10)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('rejects analyzing a profile owned by another user', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ userId: 10, cvUrl: 'https://cdn.example.com/cv.pdf' }),
      );

      await expect(service.analyzeCv(5, 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(cvAnalyzer.extractSkills).not.toHaveBeenCalled();
    });
  });
});
