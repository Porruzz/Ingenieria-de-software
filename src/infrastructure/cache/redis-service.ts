import Redis from 'ioredis';

export class RedisService {
  private readonly client: Redis;

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.client = new Redis(redisUrl);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Acquire a distributed lock. 
   * returns true if acquired, false if already locked.
   */
  async acquireLock(key: string, ttlSeconds: number = 5): Promise<boolean> {
    const result = await this.client.set(key, 'locked', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
