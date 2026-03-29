import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { EncryptionService } from "../encryption/encryption.service.js";
import { encryptionExtension } from "../common/extensions/encryption.extension.js";
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private encryption: EncryptionService) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }
  async onModuleInit() {
    const extended = this.$extends(
      encryptionExtension(this.encryption),
    );
    Object.assign(this, extended);

    await this.$connect();
  }

  async onModuleDestroy(){
    await this.$disconnect();
  }
}