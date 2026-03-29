import { ConfigService } from '@nestjs/config';
import { AuthService } from './../auth.service';
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../interfaces/jwtPayload.interface';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly extractor: (request: Request) => string | null;

    constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {
        const jwtExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
        
        super({
            jwtFromRequest: jwtExtractor,
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            algorithms: ['HS256'],
            passReqToCallback: true,
        });
        
        this.extractor = jwtExtractor;
    }

    async validate(request: Request, payload: JwtPayload) {
        const jwtToken = this.extractor(request);
        if(jwtToken){
            return await this.authService.validate(
                payload.id, 
                payload.role,
                jwtToken
            );
        }
    }
}