import { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
export async function JwtConfig(configService: ConfigService): Promise<JwtModuleOptions>{
    return {
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions:{
            algorithm: 'HS256',
        },
        verifyOptions:{
            algorithms: ['HS256'],
            ignoreExpiration: false
        }
    }
}