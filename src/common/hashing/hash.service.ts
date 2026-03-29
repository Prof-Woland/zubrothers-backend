import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

@Injectable()
export class HashService {
  async getHash(data: string): Promise<string> {
    return createHash('sha256')
      .update(data)
      .digest('hex');
  }
  async compare(data: string, existingHash: string): Promise<boolean> {
    return await this.getHash(data) === existingHash;
  }
}