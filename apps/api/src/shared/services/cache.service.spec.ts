import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  it('returns undefined for non-existent key', () => {
    expect(cacheService.get('non_existent')).toBeUndefined();
  });

  it('stores and retrieves value within TTL', () => {
    cacheService.set('key1', { name: 'Web Dev' }, 60);
    expect(cacheService.get('key1')).toEqual({ name: 'Web Dev' });
  });

  it('returns undefined and evicts entry after TTL expiration', () => {
    jest.useFakeTimers();
    try {
      cacheService.set('short_lived', 'value', 1); // 1 second TTL
      expect(cacheService.get('short_lived')).toBe('value');

      jest.advanceTimersByTime(1100); // Advance 1.1s
      expect(cacheService.get('short_lived')).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('deletes specific key', () => {
    cacheService.set('to_delete', 123, 60);
    cacheService.del('to_delete');
    expect(cacheService.get('to_delete')).toBeUndefined();
  });

  it('deletes keys by prefix', () => {
    cacheService.set('prefix_a', 1, 60);
    cacheService.set('prefix_b', 2, 60);
    cacheService.set('other_c', 3, 60);

    cacheService.delByPrefix('prefix_');

    expect(cacheService.get('prefix_a')).toBeUndefined();
    expect(cacheService.get('prefix_b')).toBeUndefined();
    expect(cacheService.get('other_c')).toBe(3);
  });

  it('wraps async function call with caching', async () => {
    const factory = jest.fn().mockResolvedValue(['cat1', 'cat2']);

    const res1 = await cacheService.wrap('categories', factory, 60);
    expect(res1).toEqual(['cat1', 'cat2']);
    expect(factory).toHaveBeenCalledTimes(1);

    // Second call should return cached result without calling factory again
    const res2 = await cacheService.wrap('categories', factory, 60);
    expect(res2).toEqual(['cat1', 'cat2']);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('resets all cache entries', () => {
    cacheService.set('k1', 'v1', 60);
    cacheService.set('k2', 'v2', 60);

    cacheService.reset();

    expect(cacheService.get('k1')).toBeUndefined();
    expect(cacheService.get('k2')).toBeUndefined();
  });
});

