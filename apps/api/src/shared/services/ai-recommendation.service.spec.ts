import {
  AiRecommendationService,
  AiServiceError,
} from './ai-recommendation.service';

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
    status: ok ? 200 : 500,
  }) as unknown as typeof fetch;
}

describe('AiRecommendationService', () => {
  let service: AiRecommendationService;

  beforeEach(() => {
    service = new AiRecommendationService();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns the model and vectors from /internal/embeddings', async () => {
    mockFetchOnce({
      model: 'bge-m3',
      dim: 2,
      vectors: [
        [1, 0],
        [0, 1],
      ],
    });

    const result = await service.embed(['a', 'b']);

    expect(result.model).toBe('bge-m3');
    expect(result.vectors).toEqual([
      [1, 0],
      [0, 1],
    ]);

    const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toContain('/internal/embeddings');
  });

  it('skips the request when there is no text to embed', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(service.embed([])).resolves.toEqual({
      model: '',
      vectors: [],
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects an embedding payload whose length does not match', async () => {
    mockFetchOnce({ model: 'bge-m3', vectors: [[1, 0]] });

    await expect(service.embed(['a', 'b'])).rejects.toBeInstanceOf(
      AiServiceError,
    );
  });

  it('posts candidates to /internal/recommend and returns the results', async () => {
    mockFetchOnce({
      results: [
        {
          id: 'cv_1',
          score: 0.8,
          components: {
            semantic: 0.7,
            skills: 0.9,
            experience: 0.5,
            budget: 0,
            preferences: 0,
            keyword: null,
          },
          section_components: {},
        },
      ],
    });

    const results = await service.recommend({
      direction: 'jd2cv',
      query: { title: 'job' },
      candidates: [{ id: 'cv_1', semantic: 0.7 }],
      topK: 5,
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cv_1');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.direction).toBe('jd2cv');
    expect(body.top_k).toBe(5);
  });

  it('maps the explanation response from /internal/explain', async () => {
    mockFetchOnce({
      ready: false,
      summary: null,
      claims: [],
      fallback_reason: 'LlmUnavailable',
      model: 'qwen2.5',
      duration_ms: 12,
    });

    const explanation = await service.explain({}, {});

    expect(explanation.ready).toBe(false);
    expect(explanation.fallbackReason).toBe('LlmUnavailable');
    expect(explanation.durationMs).toBe(12);
  });

  it('throws when the AI service is unreachable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new TypeError('fetch failed'),
      ) as unknown as typeof fetch;

    await expect(service.embed(['a'])).rejects.toThrow(
      'AI service is unreachable.',
    );
  });

  it('normalizes cosine similarity to the [0, 1] range', () => {
    expect(service.cosine([1, 0], [1, 0])).toBe(1);
    expect(service.cosine([1, 0], [0, 1])).toBeCloseTo(0.5);
    expect(service.cosine([1, 0], [-1, 0])).toBe(0);
    expect(service.cosine([], [])).toBe(0);
  });

  it('sends X-Internal-Token when FREVIA_AI_TOKEN is set', async () => {
    process.env.FREVIA_AI_TOKEN = 'secret-token';
    try {
      mockFetchOnce({ model: 'bge-m3', dim: 1, vectors: [[1]] });
      await service.embed(['a']);

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

  it('omits X-Internal-Token when FREVIA_AI_TOKEN is unset', async () => {
    delete process.env.FREVIA_AI_TOKEN;
    mockFetchOnce({ model: 'bge-m3', dim: 1, vectors: [[1]] });
    await service.embed(['a']);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(
      (init.headers as Record<string, string>)['X-Internal-Token'],
    ).toBeUndefined();
  });

  it('posts documents to /internal/index and returns the indexed count', async () => {
    mockFetchOnce({ indexed: 2, stats: {} });

    const result = await service.indexDocuments([
      { id: 'jd_1', type: 'jd', title: 'Backend' },
      { id: 'cv_1', type: 'cv', title: 'Alice' },
    ]);

    expect(result).toEqual({ indexed: 2 });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain('/internal/index');
    const body = JSON.parse(init.body as string) as {
      documents: unknown[];
    };
    expect(body.documents).toHaveLength(2);
  });

  it('skips the index request when there is no document', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(service.indexDocuments([])).resolves.toEqual({ indexed: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('posts references to /internal/index/delete and returns the count', async () => {
    mockFetchOnce({ deleted: 1, stats: {} });

    const result = await service.deleteDocuments([{ id: 'jd_1', type: 'jd' }]);

    expect(result).toEqual({ deleted: 1 });

    const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toContain('/internal/index/delete');
  });

  it('skips the delete request when there is no document', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(service.deleteDocuments([])).resolves.toEqual({ deleted: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
