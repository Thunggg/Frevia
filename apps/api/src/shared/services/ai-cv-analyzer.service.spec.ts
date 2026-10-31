import { AiCvAnalyzerService } from './ai-cv-analyzer.service';

const pdfBuffer = Buffer.from('%PDF-1.4\nfake pdf');

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
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
});
