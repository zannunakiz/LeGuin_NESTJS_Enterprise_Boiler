import { GlobalConfig } from '@/config/config.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import ms from 'ms';
import util from 'util';
import { CacheKey } from './cache.type';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService<GlobalConfig>,
  ) {}

  async get<T>(keyParams: CacheKey) {
    return this.cacheManager.get<T>(this._constructCacheKey(keyParams));
  }

  async set(
    keyParams: CacheKey,
    value: unknown,
    options?: { ttl?: number },
  ): Promise<{ key: string }> {
    const key = this._constructCacheKey(keyParams);
    await this.cacheManager.set(
      key,
      value,
      options?.ttl ? 1000 * options?.ttl : undefined,
    );
    return { key };
  }

  async storeGet<T>(keyParams: CacheKey) {
    return this.cacheManager.store.get<T>(this._constructCacheKey(keyParams));
  }

  async storeSet<T>(
    keyParams: CacheKey,
    value: T,
    options?: { ttl?: number },
  ): Promise<{ key: string }> {
    const key = this._constructCacheKey(keyParams);
    await this.cacheManager.store.set<T>(
      this._constructCacheKey(keyParams),
      value,
      ms(`${options?.ttl ?? 0}`),
    );
    return { key };
  }

  async delete(keyParams: CacheKey): Promise<{ key: string }> {
    const key = this._constructCacheKey(keyParams);
    await this.cacheManager.store.del(key);
    return { key };
  }

  private _constructCacheKey(keyParams: CacheKey): string {
    const prefix = this.configService.get('app.appPrefix', { infer: true });
    return util.format(`${prefix}-${keyParams.key}`, ...(keyParams.args ?? []));
  }
}
