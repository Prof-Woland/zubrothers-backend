import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = configService.getOrThrow("ENCRYPTION_KEY");
    if (!secret) {
      throw new Error('CRYPTO_SECRET is not set');
    }
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  encrypt(value: string): string {
    if (value === null || value === undefined) return value;

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(payload: string): string {
    if (!payload) return payload;

    const [ivB64, tagB64, dataB64] = payload.split(':');

    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  encryptObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const copy = { ...obj };

    for (const field of fields) {
      if (copy[field] !== undefined && copy[field] !== null) {
        copy[field] = this.encrypt(String(copy[field])) as any;
      }
    }

    return copy;
  }

  decryptObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const copy = { ...obj };

    for (const field of fields) {
      if (copy[field]) {
        copy[field] = this.decrypt(copy[field]) as any;
      }
    }

    return copy;
  }
}