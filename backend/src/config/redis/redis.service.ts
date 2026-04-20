import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
 
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
      },
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => console.log('✅ Redis connected successfully'));

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('❌ Redis disconnected');
  }

  // Set key with expiration (in seconds)
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  // Get value by key
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  // Delete key
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Set with JSON value
  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  // Get JSON value
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  // Increment counter (for rate limiting)
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  // Set expiration on existing key
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  // Get time to live
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // Professional PIN rate limiter
async incrementAttempts(
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<void> {
  const current = await this.incr(key);
  
  console.log('PIN Attempts for key:', key, '→', current);
  // Set TTL only on first attempt
  if (current === 1) {
    await this.expire(key, windowSeconds);
  }

  if (current > limit) {
    const ttl = await this.ttl(key);
    throw new Error(
      `Too many failed attempts. Try again in ${ttl} seconds.`,
    );
  }
}
  // Store OTP
  async storeOtp(phone: string, otp: string, ttl: number = 300): Promise<void> {
    await this.set(`otp:${phone}`, otp, ttl);
  }

  // Verify OTP
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const storedOtp = await this.get(`otp:${phone}`);
    if (storedOtp === otp) {
      await this.del(`otp:${phone}`);
      return true;
    }
    return false;
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = `rate:${identifier}`;
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.expire(key, window);
    }
    
    return current <= limit;
  }

  // Idempotency key (prevent double payment)
  async setIdempotencyKey(key: string, value: string, ttl: number = 3600): Promise<boolean> {
    const fullKey = `idempotency:${key}`;
    const exists = await this.exists(fullKey);
    
    if (exists) {
      return false;
    }
    
    await this.set(fullKey, value, ttl);
    return true;
  }

  // Get idempotency result
  async getIdempotencyResult(key: string): Promise<string | null> {
    return await this.get(`idempotency:${key}`);
  }
}
