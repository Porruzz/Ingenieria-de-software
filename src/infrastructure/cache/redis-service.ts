import Redis from 'ioredis';

export class RedisService {
  private readonly client: Redis;

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Redis] No se pudo conectar. Continuando en modo degradado (sin cache).');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });

    this.client.on('error', (err) => {
      // Silenciamos el error para que no llene la consola si no hay Redis
    });
  }


  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (e) { /* silent fail */ }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client.status !== 'ready') return null;
      return await this.client.get(key);
    } catch (e) { return null; }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      await this.client.del(key);
    } catch (e) { /* silent fail */ }
  }

  /**
   * Acquire a distributed lock. 
   * returns true if acquired, false if already locked.
   */
  async acquireLock(key: string, ttlSeconds: number = 5): Promise<boolean> {
    try {
      if (this.client.status !== 'ready') return true; // Si no hay redis, permitimos pasar (modo degradado)
      const result = await this.client.set(key, 'locked', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (e) { return true; }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      await this.client.del(key);
    } catch (e) { /* silent fail */ }
  }


  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
