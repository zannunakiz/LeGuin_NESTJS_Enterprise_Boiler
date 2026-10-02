import { getConfig as getAppConfig } from '@/config/app.config';
import { CacheKey } from '@/constants/cache.constant';
import util from 'util';

export const createCacheKey = (key: CacheKey, ...args: string[]): string => {
  const config = getAppConfig();
  const prefix = config.appPrefix;
  return util.format(`${prefix}-${key}`, ...args);
};
