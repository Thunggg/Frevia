import { AiCvAnalyzerService } from './ai-cv-analyzer.service';

const pdfBuffer = Buffer.from('%PDF-1.4\nfake pdf');

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
    status: ok ? 200 : 500,
  }) as unknown as typeof fetch;
}

describe('AiCvAnalyzerService', () => {
  let service: AiCvAnalyzerService;

  beforeEach(() => {
    service = new AiCvAnalyzerService();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('sends the CV as a multipart file and maps the upstream skills', async () => {
    mockFetchOnce({
      professional_title: 'Backend Developer',
      skills: [
        { name: 'TypeScript', proficiency_level: 8 },
        { name: 'docker', proficiency_level: null },
        { name: '', proficiency_level: 5 },
      ],
      education: [],
    });

    const result = await service.extractSkills(pdfBuffer, 'resume.pdf');

    expect(result).toEqual([
      { name: 'TypeScript', proficiencyLevel: 8 },
      { name: 'docker', proficiencyLevel: null },
    ]);

    const sent = global.fetch as jest.Mock;
    expect(sent).toHaveBeenCalledTimes(1);
    const [url, init] = sent.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/ai/analyze-cv');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('clamps out-of-range proficiency values to null', async () => {
    mockFetchOnce({
      skills: [{ name: 'React', proficiency_level: 99 }],
    });

    await expect(service.extractSkills(pdfBuffer, 'cv.pdf')).resolves.toEqual([
      { name: 'React', proficiencyLevel: null },
    ]);
  });

  it('returns an empty list when upstream returns no skills', async () => {
    mockFetchOnce({ professional_title: null });

    await expect(service.extractSkills(pdfBuffer, 'cv.pdf')).resolves.toEqual(
      [],
    );
  });

  it('analyze maps the full payload and meta', async () => {
    mockFetchOnce({
      skills: [
        {
          name: 'React',
          proficiency_level: 8,
          confidence: 0.9,
          evidence: 'built React apps',
        },
        { name: 'Docker', proficiency_level: null },
      ],
      experience: [
        {
          title: 'Frontend Developer',
          company: 'Acme',
          start_date: '2022-03',
          end_date: null,
          is_current: true,
          description: 'Built the design system',
          confidence: 0.75,
        },
      ],
      education: [
        {
          degree: 'BSc CS',
          school: 'HCMUT',
          start_year: 2018,
          end_year: 2022,
          confidence: 0.8,
        },
      ],
      projects: [
        {
          name: 'Shop App',
          technologies: ['React Native', 'Stripe'],
          description: 'E-commerce app',
          confidence: 0.6,
        },
      ],
      summary: 'Frontend developer...',
      meta: {
        source: 'pdf_text',
        pages: 2,
        chars: 8421,
        truncated: false,
        ocr_used: false,
        model: 'qwen2.5:7b-instruct',
        duration_ms: 8123,
        warnings: ['EMPTY_SECTION:projects'],
      },
    });

    const result = await service.analyze(pdfBuffer, 'resume.pdf');

    expect(result.skills).toEqual([
      {
        name: 'React',
        proficiencyLevel: 8,
        confidence: 0.9,
        evidence: 'built React apps',
      },
      {
        name: 'Docker',
        proficiencyLevel: null,
        confidence: null,
        evidence: null,
      },
    ]);
    expect(result.experience[0]).toMatchObject({
      title: 'Frontend Developer',
      company: 'Acme',
      startDate: '2022-03',
      endDate: null,
      isCurrent: true,
      confidence: 0.75,
    });
    expect(result.education[0]).toMatchObject({
      degree: 'BSc CS',
      school: 'HCMUT',
      startYear: 2018,
      endYear: 2022,
    });
    expect(result.projects[0]).toMatchObject({
      name: 'Shop App',
      technologies: ['React Native', 'Stripe'],
      confidence: 0.6,
    });
    expect(result.summary).toBe('Frontend developer...');
    expect(result.meta).toEqual({
      source: 'pdf_text',
      pages: 2,
      chars: 8421,
      truncated: false,
      ocrUsed: false,
      model: 'qwen2.5:7b-instruct',
      durationMs: 8123,
      warnings: ['EMPTY_SECTION:projects'],
    });
  });

  it('analyze falls back to safe defaults when meta is missing', async () => {
    mockFetchOnce({ skills: [{ name: 'React', proficiency_level: 5 }] });

    const result = await service.analyze(pdfBuffer, 'cv.pdf');

    expect(result.experience).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.summary).toBeNull();
    expect(result.meta).toEqual({
      source: 'pdf_text',
      pages: 0,
      chars: 0,
      truncated: false,
      ocrUsed: false,
      model: null,
      durationMs: null,
      warnings: [],
    });
  });

  it('throws when the upstream service is unreachable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new TypeError('fetch failed'),
      ) as unknown as typeof fetch;

    await expect(service.extractSkills(pdfBuffer, 'cv.pdf')).rejects.toThrow(
      'AI CV analysis service is unreachable.',
    );
  });

  it('throws when the upstream responds with an error status', async () => {
    mockFetchOnce({ detail: 'boom' }, false);

    await expect(service.extractSkills(pdfBuffer, 'cv.pdf')).rejects.toThrow(
      'AI CV analysis service failed (500).',
    );
  });

  it('sends X-Internal-Token when FREVIA_AI_TOKEN is set', async () => {
    process.env.FREVIA_AI_TOKEN = 'secret-token';
    try {
      mockFetchOnce({ skills: [] });
      await service.extractSkills(pdfBuffer, 'cv.pdf');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect((init.headers as Record<string, string>)['X-Internal-Token']).toBe(
        'secret-token',
      );
    } finally {
      delete process.env.FREVIA_AI_TOKEN;
    }
  });
});
