import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Simple in-memory cache middleware
 * Caches GET requests for a specified duration
 * Invalidates cache on POST/PUT/DELETE requests
 */
export function cacheMiddleware(ttl: number = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Get user-specific cache key prefix (use profileId if available)
    const userId = (req as any).profileId || (req as any).userId || 'anonymous';
    const basePath = req.baseUrl || '';
    
    // For POST/PUT/DELETE, invalidate cache for this path and user
    if (req.method !== 'GET') {
      const pathPrefix = `${userId}:${basePath}`;
      console.log(`🗑️ [Cache] Invalidating cache for: ${pathPrefix}`);
      
      // Clear all cache entries that start with this prefix
      for (const key of cache.keys()) {
        if (key.startsWith(pathPrefix)) {
          cache.delete(key);
          console.log(`🗑️ [Cache] Deleted: ${key}`);
        }
      }
      
      return next();
    }

    // Create user-specific cache key
    const cacheKey = `${userId}:${basePath}${req.path}?${new URLSearchParams(req.query as Record<string, string>).toString()}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      // Return cached response
      console.log(`📦 [Cache] HIT: ${cacheKey}`);
      res.json(cached.data);
      return;
    }

    console.log(`📦 [Cache] MISS: ${cacheKey}`);

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data: body,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        });
        console.log(`📦 [Cache] SET: ${cacheKey}`);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clear cache for a specific path pattern
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      expiresIn: entry.expiresAt - Date.now(),
    })),
  };
}

