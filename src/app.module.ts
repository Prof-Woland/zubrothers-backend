import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './encryption/encryption.module';
import { HashService } from './common/hashing/hash.service';

@Module({
  imports: [PrismaModule, CacheModule.register({
    isGlobal: true
  }),ConfigModule.forRoot({
    isGlobal: true,
  }), AuthModule, EncryptionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
