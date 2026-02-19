// lib/rateLimit.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Limit requests to 5 per second per endpoint
  private readonly MAX_REQUESTS = 5;
  private readonly TIME_WINDOW = 1000; // 1 second
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  async fetchWithRateLimit(url: string, options?: RequestInit): Promise<any> {
    const key = url.split('?')[0]; // Remove query params for rate limiting
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[RateLimit] Using cached response for ${key}`);
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Clean old timestamps
    const recentTimestamps = timestamps.filter(t => now - t < this.TIME_WINDOW);
    
    if (recentTimestamps.length >= this.MAX_REQUESTS) {
      const oldestTimestamp = recentTimestamps[0];
      const waitTime = this.TIME_WINDOW - (now - oldestTimestamp);
      console.log(`[RateLimit] Too many requests to ${key}, waiting ${waitTime}ms`);
      
      // Wait for rate limit window to reset
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.fetchWithRateLimit(url, options); // Retry after waiting
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    this.requests.set(key, recentTimestamps);
    
    // Make the actual request
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Cache the response
      this.cache.set(key, { data, timestamp: now });
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Clear cache for a specific key
  invalidateCache(key: string) {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }
}

export const rateLimiter = new RateLimiter();