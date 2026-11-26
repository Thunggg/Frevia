import { Injectable, Logger } from '@nestjs/common';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const MAX_CACHE_ENTRIES = 2000;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();

  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Lấy giá trị từ cache theo key. Trả về undefined nếu không tồn tại hoặc đã hết hạn.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Lưu giá trị vào cache với thời gian sống (TTL) tính bằng giây.
   * Giới hạn tối đa MAX_CACHE_ENTRIES để tránh rò rỉ bộ nhớ (OOM).
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (ttlSeconds <= 0) return;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= MAX_CACHE_ENTRIES) {
      this.sweepExpired();
      while (this.store.size >= MAX_CACHE_ENTRIES) {
        const oldest = this.store.keys().next();
        if (oldest.done) break;
        this.store.delete(oldest.value);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Xóa 1 key cụ thể khỏi cache.
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Xóa tất cả các key bắt đầu bằng prefix (tiện lợi cho việc invalidate nhóm dữ liệu).
   */
  delByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Wrap hàm bất đồng bộ: Trả về dữ liệu từ cache nếu có;
   * nếu không, thực thi fn(), lưu kết quả vào cache với TTL và trả về.
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Xóa toàn bộ dữ liệu trong cache.
   */
  reset(): void {
    this.store.clear();
  }
}
