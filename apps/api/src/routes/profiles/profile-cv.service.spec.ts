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
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';
import { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import {
  CvAnalysisNotFoundException,
  CvAnalysisNotPendingException,
  CvAnalysisStaleException,
  CvFileInvalidException,
  CvFileRequiredException,
  CvFileTooLargeException,
  CvFileTypeException,
  CvNotFoundException,
} from './profile.error';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

import { unlink } from 'fs/promises';

const CV_URL = 'https://cdn.example.com/cv.pdf';

const freelancerProfile = ({
  userId = 10,
  cvUrl = null,
  cvPublicId = null,
  cvFileName = null,
  cvUploadedAt = null,
}: {
  userId?: number;
  cvUrl?: string | null;
  cvPublicId?: string | null;
  cvFileName?: string | null;
  cvUploadedAt?: Date | null;
} = {}) => ({
  id: 5,
  userId,
  freelancerProfile: { id: 5, cvUrl, cvPublicId, cvFileName, cvUploadedAt },
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

const cvAnalyzeResult = (overrides: Record<string, unknown> = {}) => ({
  skills: [],
  experience: [],
  education: [],
  projects: [],
  summary: null,
  meta: {
    source: 'pdf_text' as const,
    pages: 1,
    chars: 100,
    truncated: false,
    ocrUsed: false,
    model: 'qwen2.5:7b-instruct',
    durationMs: 1000,
    warnings: [],
  },
  ...overrides,
});

const cvAnalysisRow = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  freelancerProfileId: 5,
  status: 'PENDING',
  cvUrl: CV_URL,
  cvFileName: 'resume.pdf',
  cvUploadedAt: new Date('2026-01-01T00:00:00Z'),
  source: 'PDF_TEXT',
  pages: 1,
  chars: 100,
  truncated: false,
  ocrUsed: false,
  model: 'qwen2.5:7b-instruct',
  durationMs: 1000,
  warnings: [],
  payload: {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    summary: null,
  },
  confirmedAt: null,
  discardedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const cvAnalysisWithProfile = (overrides: Record<string, unknown> = {}) => {
  const { freelancerProfile, ...rest } = overrides as {
    freelancerProfile?: Record<string, unknown>;
  } & Record<string, unknown>;
  return {
    ...cvAnalysisRow(rest),
    freelancerProfile: {
      id: 5,
      profileId: 3,
      cvUrl: CV_URL,
      profile: { userId: 10 },
      ...freelancerProfile,
    },
  };
};

describe('ProfileService CV', () => {
  let repository: {
    findFreelancerProfileById: jest.Mock;
    updateCv: jest.Mock;
    clearCv: jest.Mock;
    findSkillsByProfileId: jest.Mock;
    findOrCreateCatalogSkill: jest.Mock;
    addSkillToProfile: jest.Mock;
    createCvAnalysis: jest.Mock;
    findPendingCvAnalysis: jest.Mock;
    findCvAnalysisById: jest.Mock;
    discardCvAnalysis: jest.Mock;
    confirmCvAnalysis: jest.Mock;
  };
  let cloudinary: {
    isConfigured: jest.Mock;
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
  };
  let cvAnalyzer: {
    analyze: jest.Mock;
    extractSkills: jest.Mock;
  };
  let skillResolver: {
    resolveSkills: jest.Mock;
    resolveSkillEntries: jest.Mock;
  };
  let recommendationIndex: {
    enqueueAndProcess: jest.Mock;
  };
  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      findFreelancerProfileById: jest.fn(),
      updateCv: jest.fn(),
      clearCv: jest.fn().mockResolvedValue(undefined),
      findSkillsByProfileId: jest.fn().mockResolvedValue([]),
      findOrCreateCatalogSkill: jest.fn(),
      addSkillToProfile: jest.fn(),
      createCvAnalysis: jest.fn(),
      findPendingCvAnalysis: jest.fn(),
      findCvAnalysisById: jest.fn(),
      discardCvAnalysis: jest.fn(),
      confirmCvAnalysis: jest.fn(),
    };
    cloudinary = {
      isConfigured: jest.fn().mockReturnValue(false),
      uploadFile: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    cvAnalyzer = {
      analyze: jest.fn(),
      extractSkills: jest.fn(),
    };
    skillResolver = {
      resolveSkills: jest.fn().mockResolvedValue([]),
      resolveSkillEntries: jest.fn().mockResolvedValue([]),
    };
    recommendationIndex = {
      enqueueAndProcess: jest.fn().mockResolvedValue(undefined),
    };
    service = new ProfileService(
      repository as unknown as ProfileRepository,
      cloudinary as unknown as CloudinaryService,
      cvAnalyzer as unknown as AiCvAnalyzerService,
      skillResolver as unknown as SkillResolverService,
      {} as ProfileRevisionService,
      recommendationIndex as unknown as EmbeddingOutboxService,
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

    it('rejects a file whose mimetype is not PDF', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(
        service.uploadCv(
          5,
          10,
          pdfFile({ mimetype: 'application/octet-stream' }),
        ),
      ).rejects.toEqual(CvFileTypeException());
    });

    it('accepts a PDF that has leading bytes before the %PDF- header', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );
      repository.updateCv.mockResolvedValue({
        cvUrl: 'local://cvs/10/some-uuid.pdf',
        cvFileName: 'resume.pdf',
      });

      const buffer = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from('%PDF-1.4\nfake pdf content'),
      ]);

      await expect(
        service.uploadCv(5, 10, pdfFile({ buffer })),
      ).resolves.toEqual({
        cvUrl: '/api/backend/profiles/5/cv/file',
        cvFileName: 'resume.pdf',
      });
    });

    it('rejects a file larger than 10 MB', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(
        service.uploadCv(5, 10, pdfFile({ size: 11 * 1024 * 1024 })),
      ).rejects.toEqual(CvFileTooLargeException());
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

    it('deletes the replaced local file from disk', async () => {
      cloudinary.isConfigured.mockReturnValue(false);
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'local://cvs/10/old-uuid.pdf',
          cvFileName: 'old.pdf',
        }),
      );
      repository.updateCv.mockResolvedValue({
        cvUrl: 'local://cvs/10/new-uuid.pdf',
        cvFileName: 'new.pdf',
      });

      await service.uploadCv(5, 10, pdfFile({ originalname: 'new.pdf' }));

      expect(unlink).toHaveBeenCalledWith(
        expect.stringContaining('old-uuid.pdf'),
      );
    });
  });

  describe('deleteCv', () => {
    it('rejects deleting when the profile has no CV', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile(),
      );

      await expect(service.deleteCv(5, 10)).rejects.toEqual(
        CvNotFoundException(),
      );
      expect(repository.clearCv).not.toHaveBeenCalled();
    });

    it('rejects deleting a CV owned by another user', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          userId: 10,
          cvUrl: 'https://cdn.example.com/cv.pdf',
        }),
      );

      await expect(service.deleteCv(5, 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.clearCv).not.toHaveBeenCalled();
    });

    it('deletes the Cloudinary asset and clears the CV fields', async () => {
      const profile = freelancerProfile({
        cvUrl: 'https://res.cloudinary.com/example/frevia/cvs/10/cv.pdf',
        cvPublicId: 'frevia/cvs/10/cv',
        cvFileName: 'resume.pdf',
      });
      repository.findFreelancerProfileById.mockResolvedValue(profile);

      const result = await service.deleteCv(5, 10);

      expect(cloudinary.deleteFile).toHaveBeenCalledWith('frevia/cvs/10/cv');
      expect(repository.clearCv).toHaveBeenCalledWith(5);
      expect(result).toEqual({ message: 'CV deleted successfully.' });
    });

    it('removes the local file and clears the CV fields', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: 'local://cvs/10/some-uuid.pdf',
          cvFileName: 'resume.pdf',
        }),
      );

      const result = await service.deleteCv(5, 10);

      expect(unlink).toHaveBeenCalledWith(
        expect.stringContaining('some-uuid.pdf'),
      );
      expect(repository.clearCv).toHaveBeenCalledWith(5);
      expect(result).toEqual({ message: 'CV deleted successfully.' });
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
      expect(cvAnalyzer.analyze).not.toHaveBeenCalled();
    });

    it('persists a draft and maps AI-extracted skills to catalog names', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: CV_URL,
          cvFileName: 'resume.pdf',
          cvUploadedAt: new Date('2026-01-01T00:00:00Z'),
        }),
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('%PDF-fake')),
      }) as unknown as typeof fetch;
      cvAnalyzer.analyze.mockResolvedValue(
        cvAnalyzeResult({
          skills: [
            {
              name: 'js',
              proficiencyLevel: 8,
              confidence: 0.9,
              evidence: 'js',
            },
            {
              name: 'PostgreSQL',
              proficiencyLevel: 7,
              confidence: null,
              evidence: null,
            },
            {
              name: 'Standalone AI Skill',
              proficiencyLevel: 4,
              confidence: null,
              evidence: null,
            },
          ],
        }),
      );
      skillResolver.resolveSkillEntries.mockResolvedValue([
        {
          name: 'js',
          skill: { id: 1, name: 'javascript', slug: 'javascript' },
        },
        {
          name: 'PostgreSQL',
          skill: { id: 2, name: 'PostgreSQL', slug: 'postgresql' },
        },
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
      repository.createCvAnalysis.mockResolvedValue(
        cvAnalysisRow({
          payload: {
            skills: [
              {
                name: 'js',
                proficiencyLevel: 8,
                confidence: 0.9,
                evidence: 'js',
              },
            ],
            experience: [],
            education: [],
            projects: [],
            summary: null,
          },
        }),
      );

      const result = await service.analyzeCv(5, 10);

      expect(result.suggestions).toEqual([
        { skillName: 'javascript', proficiencyLevel: 8 },
        { skillName: 'Standalone AI Skill', proficiencyLevel: 4 },
      ]);
      expect(result.analysis.id).toBe(7);
      expect(result.analysis.status).toBe('PENDING');
      expect(result.analysis.isStale).toBe(false);
      expect(repository.createCvAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          freelancerProfileId: 5,
          cvUrl: CV_URL,
          source: 'PDF_TEXT',
        }),
      );
      expect(cvAnalyzer.analyze).toHaveBeenCalledWith(
        expect.any(Buffer),
        'resume.pdf',
      );
    });

    it('throws a service-unavailable exception when the AI call fails', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          cvUrl: CV_URL,
        }),
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('%PDF-fake')),
      }) as unknown as typeof fetch;
      cvAnalyzer.analyze.mockRejectedValue(
        new Error('AI CV analysis service is unreachable.'),
      );

      await expect(service.analyzeCv(5, 10)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(repository.createCvAnalysis).not.toHaveBeenCalled();
    });

    it('rejects analyzing a profile owned by another user', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({
          userId: 10,
          cvUrl: CV_URL,
        }),
      );

      await expect(service.analyzeCv(5, 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(cvAnalyzer.analyze).not.toHaveBeenCalled();
    });
  });

  describe('getCvAnalysis', () => {
    it('returns the latest pending draft and flags it stale when the CV changed', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: 'https://cdn.example.com/new.pdf' }),
      );
      repository.findPendingCvAnalysis.mockResolvedValue(cvAnalysisRow());

      const result = await service.getCvAnalysis(5, 10);

      expect(result.id).toBe(7);
      expect(result.isStale).toBe(true);
    });

    it('throws when there is no pending draft', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findPendingCvAnalysis.mockResolvedValue(null);

      await expect(service.getCvAnalysis(5, 10)).rejects.toEqual(
        CvAnalysisNotFoundException(),
      );
    });
  });

  describe('confirmCvAnalysis', () => {
    const confirmedDto = {
      skills: [{ skillName: 'React', proficiencyLevel: 8 }],
      experience: [
        {
          title: 'Frontend Developer',
          company: 'Acme',
          startDate: '2022-03',
          endDate: null,
          isCurrent: true,
          description: null,
        },
      ],
      education: [],
      projects: [],
    };

    it('throws when the draft does not exist', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(null);

      await expect(
        service.confirmCvAnalysis(5, 10, 7, confirmedDto),
      ).rejects.toEqual(CvAnalysisNotFoundException());
    });

    it('rejects a draft owned by another user', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ userId: 10, cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(
        cvAnalysisWithProfile({
          freelancerProfile: {
            id: 5,
            profileId: 3,
            cvUrl: CV_URL,
            profile: { userId: 99 },
          },
        }),
      );

      await expect(
        service.confirmCvAnalysis(5, 10, 7, confirmedDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a draft that is no longer pending', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(
        cvAnalysisWithProfile({ status: 'CONFIRMED' }),
      );

      await expect(
        service.confirmCvAnalysis(5, 10, 7, confirmedDto),
      ).rejects.toEqual(CvAnalysisNotPendingException());
    });

    it('rejects a stale draft (CV was replaced)', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: 'https://cdn.example.com/new.pdf' }),
      );
      repository.findCvAnalysisById.mockResolvedValue(cvAnalysisWithProfile());

      await expect(
        service.confirmCvAnalysis(5, 10, 7, confirmedDto),
      ).rejects.toEqual(CvAnalysisStaleException());
    });

    it('writes the confirmed data, recomputes strength and syncs the index', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(cvAnalysisWithProfile());
      repository.findSkillsByProfileId.mockResolvedValue([]);
      repository.findOrCreateCatalogSkill.mockResolvedValue({
        id: 42,
        name: 'React',
        slug: 'react',
      });
      repository.confirmCvAnalysis.mockResolvedValue({
        profileCompletionPercent: 57,
      });

      const result = await service.confirmCvAnalysis(5, 10, 7, confirmedDto);

      expect(repository.confirmCvAnalysis).toHaveBeenCalledWith({
        analysisId: 7,
        freelancerProfileId: 5,
        skills: [{ skillId: 42, proficiencyLevel: 8 }],
        experience: [
          {
            title: 'Frontend Developer',
            company: 'Acme',
            startDate: '2022-03',
            endDate: null,
            isCurrent: true,
            description: null,
          },
        ],
        education: [],
        projects: [],
      });
      expect(recommendationIndex.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'CV',
        documentId: 5,
      });
      expect(result).toEqual({
        message: 'Success.CvAnalysisConfirmed',
        status: 'CONFIRMED',
        counts: { skills: 1, experience: 1, education: 0, projects: 0 },
        profileCompletionPercent: 57,
      });
    });

    it('throws when the optimistic claim fails (already processed)', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(cvAnalysisWithProfile());
      repository.findSkillsByProfileId.mockResolvedValue([]);
      repository.confirmCvAnalysis.mockResolvedValue(null);

      await expect(
        service.confirmCvAnalysis(5, 10, 7, { skills: [], experience: [] }),
      ).rejects.toEqual(CvAnalysisNotPendingException());
    });
  });

  describe('discardCvAnalysis', () => {
    it('marks the draft as discarded', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(cvAnalysisWithProfile());
      repository.discardCvAnalysis.mockResolvedValue(true);

      await expect(service.discardCvAnalysis(5, 10, 7)).resolves.toEqual({
        message: 'Success.CvAnalysisDiscarded',
        status: 'DISCARDED',
      });
    });

    it('throws when the draft is already processed', async () => {
      repository.findFreelancerProfileById.mockResolvedValue(
        freelancerProfile({ cvUrl: CV_URL }),
      );
      repository.findCvAnalysisById.mockResolvedValue(cvAnalysisWithProfile());
      repository.discardCvAnalysis.mockResolvedValue(false);

      await expect(service.discardCvAnalysis(5, 10, 7)).rejects.toEqual(
        CvAnalysisNotPendingException(),
      );
    });
  });
});
