import { HashService } from './../common/hashing/hash.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './../prisma/prisma.service';
import { ConflictException, ForbiddenException, ImATeapotException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AllLogger } from 'src/common/log/logger.log';
import { AuthDto, UpdateDto, UserDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request, Response } from 'express';
import { isDev } from 'src/utils/isDev.utils';
import { ExtractJwt } from 'passport-jwt';
import { RefreshDto } from './dto/refresh.dto';
import { User } from '../generated/prisma/client';


@Injectable()
export class AuthService {
    private readonly name = AuthService.name;
    private readonly logger = new AllLogger()
    private readonly JWT_SECRET: string;
    private readonly JWT_ACCESS_TOKEN_TTL: string;
    private readonly JWT_REFRESH_TOKEN_TTL: string;
    private readonly extractor: (request: Request) => string | null;
    constructor(private readonly prismaService: PrismaService, private readonly configService: ConfigService, private readonly hashService: HashService, private readonly jwtService: JwtService, @Inject(CACHE_MANAGER) private cacheManager: Cache){
        this.JWT_SECRET = this.configService.getOrThrow("JWT_SECRET")
        this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow("JWT_ACCESS_TOKEN_TTL");
        this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow("JWT_REFRESH_TOKEN_TTL");
        const jwtExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
        this.extractor = jwtExtractor;
    }

    async registration(dto: UserDto, res: Response){
        const {login, email, phone, name, surname, patronymic, telegram, password} = dto;
        this.logger.log(`Try to create new user: ${login}`, this.name);
        const user = await this.prismaService.user.findFirst({
            where:{
                emailHash: await this.hashService.getHash(email)
            }
        });

        if(user){
            this.logger.warn(`User with this login is already exist: ${login}`, this.name);
            throw new ConflictException("User with this login is already exist");
        };
        const newUser = await this.prismaService.user.create({
            data:{
                login,
                email,
                name,
                surname,
                patronymic,
                phone,
                telegram,
                password: await hash(password),
                emailHash: await this.hashService.getHash(email),
                phoneHash: await this.hashService.getHash(phone),
                telegramHash: await this.hashService.getHash(telegram),
            }
        });
        const returnUser = await this.prismaService.user.findFirst({
            where:{
                emailHash: await this.hashService.getHash(email)
            },
            select:{
                id: true,
                login: true,
                name: true,
                surname: true,
                email: true,
            }
        });

        this.logger.log(`Complete!: ${login}`, this.name);
        const tokens = this.auth(res, newUser.id, newUser.role)
        return {user:returnUser, tokens}
    }

    async authorization(dto: AuthDto, res: Response){
        const {email, password} = dto;
        this.logger.log(`Try to authorizate user: ${email}`, this.name);
        const user = await this.prismaService.user.findFirst({
            where:{
                emailHash: await this.hashService.getHash(email)
            },
            select:{
                id: true,
                login: true,
                name: true,
                surname: true,
                email: true,
                role: true,
                password: true,
            }
        });

        if(!user){
            this.logger.warn(`User with this login not found: ${email}`, this.name);
            throw new NotFoundException("User with this login not found");
        };
        const isPasswordTrue = await verify(user.password, password);
        if(!isPasswordTrue){
            this.logger.warn(`False password: ${email}`, this.name);
            throw new NotFoundException('False password');
        };

        const returnUser = await this.prismaService.user.findFirst({
            where:{
                emailHash: await this.hashService.getHash(email)
            },
            select:{
                id: true,
                login: true,
                name: true,
                surname: true,
                email: true,
                role: true,
            }
        });

        this.logger.log("Successful!", this.name);
        const tokens = this.auth(res, user.id, user.role)
        return {user:returnUser, tokens}
    }

    async refresh(req: Request, dto: RefreshDto, res: Response){
        const {id} = dto
        const refreshToken = req.cookies["refreshToken"];
        this.logger.log(`Refresh request: ${id}`, this.name);

        const decodeObject = this.jwtService.decode(refreshToken);
        
        if(!decodeObject){
            this.logger.warn(`Invalid token`, this.name);
            throw new ForbiddenException('Невалидный токен обновления');
        }
        if(decodeObject.exp <= Date.now()/1000){
            this.logger.warn(`Old token`, this.name);
            throw new ForbiddenException('Устаревший токен обновления');
        };

        let payload: JwtPayload;
        
        try{
            payload = await this.jwtService.verifyAsync(refreshToken, {secret: this.JWT_SECRET});
        }
        catch(InternalServerErrorException){
            this.logger.warn(`Invalid token`, this.name);
            throw new ForbiddenException('Неверный ключ токена обновления');
        }
        
        const exist = await this.getCacheTokens(id)

        if(refreshToken != exist?.refreshToken){
            this.logger.log(`Wrong refresh token`, this.name);
            throw new ForbiddenException('Скомпрометированный токен обновления')
        }
        this.logger.log(`Successful refresh`, this.name);

        return this.auth(res, id, payload.role)
    }

    async logout(res: Response){
        this.setCookie(res, `refreshToken`, new Date(0));
    }

    // async update(user: User, dto: UpdateDto){
    //     this.logger.log(`Try to update user: ${user.email}`, this.name);
    //     const thisUser = await this.prismaService.user.findFirst({
    //         where:{
    //             email: user.email
    //         },
    //         select:{
    //             id: true,
    //             password: true,
    //             role: true
    //         }
    //     });

    //     if(!thisUser){
    //         this.logger.warn(`User with this login not found: ${user.email}`, this.name);
    //         throw new NotFoundException("User with this login not found");
    //     };

    //     if(user.email != dto.email){
    //     const returnUser = await this.prismaService.user.findFirst({
    //         where:{
    //             email: dto.email
    //         },
    //     });
        
    //     if(returnUser){
    //         this.logger.warn('Conflict, this data is already used', this.name);
    //         throw new ConflictException('This data is already used')
    //     }
    //     }

    //     const updated = await this.prismaService.user.update({
    //         where:{
    //             id: user.id
    //         },
    //         data:{
    //             ...dto
    //         }
    //     })

    //     this.logger.log("Successful!", this.name);
    //     return updated
    // }

    private auth(res: Response, id: string, role: string){
        this.logger.log('Try to cache tokens', this.name);
        const {access_token, refresh_token} = this.generateTokens(id, role);

        this.setCookie(res, refresh_token, new Date(Date.now() + 1000*60*60*24*7));
        this.createCache(id, access_token, refresh_token);
        this.logger.log('Successful', this.name);
        try{
            this.cacheManager.del(`${id + 'at'}`)
            this.cacheManager.del(`${id + 'rt'}`)
            this.createCache(id, access_token, refresh_token)
        }
        catch(InternalServerErrorException){
            this.logger.warn(`Failed to update tokens: ${id}`, this.name)
        }
        return {accessToken: access_token}
    }

    private generateTokens(id: string, role: string){
        this.logger.log(`Try to generate tokens: ${id}`, this.name);
        const payload: JwtPayload = {id, role};
        const access_token = this.jwtService.sign(payload, {expiresIn: '2h', secret: this.JWT_SECRET});
        const refresh_token = this.jwtService.sign(payload, {expiresIn: '7d', secret: this.JWT_SECRET});

        this.logger.log(`Successful: ${id}`, this.name);
        return {access_token, refresh_token}
    }

    private async createCache(id: string, accessToken: string,  refreshToken: string):Promise<boolean>{
        this.logger.log(`Try to cache tokens: ${id}`, this.name);
        try{
            await this.cacheManager.set(`${id + 'at'}`, `${accessToken}`, 10800000);
            await this.cacheManager.set(`${id + 'rt'}`, `${refreshToken}`, 691200000);
        }
        catch(InternalServerErrorException){
            this.logger.warn(`Failed to add tokens to cache: ${id}`, this.name);
            throw new ImATeapotException('Не удалось добавить токены в кэш');
        };

        this.logger.log(`Successful: ${id}`, this.name);
        return true
    }

    private async getCacheTokens(id: string){
        this.logger.log(`Try to get tokens from cache: ${id}`, this.name);
        const accessToken = await this.cacheManager.get(`${id + 'at'}`);
        const refreshToken = await this.cacheManager.get(`${id + 'rt'}`);
        if(!accessToken){
            this.logger.warn(`Failed to get accessToken from cache: ${id}`, this.name);
            throw new ForbiddenException('Не удалось получить токен доступа из кэша. Токен скомпрометирован');
        }
        if(!refreshToken){
            this.logger.warn(`Failed to get refreshToken from cache: ${id}`, this.name);
            throw new ForbiddenException('Не удалось получить токен обновления из кэша. Токен скомпрометирован');
        }

        this.logger.log(`Successful: ${id}`, this.name);
        return {accessToken, refreshToken}
    }

    private async setCookie(res: Response, value: string, expires: Date){
        res.cookie('refreshToken', value, {
            httpOnly: true,
            expires,
            secure: !isDev(this.configService),
            sameSite: isDev(this.configService)? 'none' : 'lax',
        })
    }

    async validate(id: string, role:string, token: string){
        this.logger.log('User validation', this.name)
        const user = await this.prismaService.user.findUnique({
            where: {
                id
            },
        });

        let payload: JwtPayload;
        try{
            payload = await this.jwtService.verifyAsync(token, {secret: this.JWT_SECRET});
        }
        catch(InternalServerErrorException){
            this.logger.warn(`Invalid token`, this.name);
            throw new ForbiddenException('Неверный ключ токена обновления');
        }

        if(!user){
            throw new NotFoundException();
        };
        const extToken = await this.getCacheTokens(id)

        if(extToken?.accessToken != token){
            throw new ForbiddenException('Скомпрометированный токен доступа')
        }
        this.logger.log('Successful', this.name)
        return user
    }
}
