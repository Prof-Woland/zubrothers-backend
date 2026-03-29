import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';


export class UserDto{
    @IsNotEmpty()
    @IsString()
    @Length(2, 128, {message:'Логин должен содержать минимум 2 символа'})
    login: string

    @IsNotEmpty()
    @IsString()
    @Length(8, 128, {message:'Пароль должен содержать минимум 8 символов'})
    password: string

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    surname: string

    @IsNotEmpty()
    @IsString()
    patronymic: string

    @IsEmail()
    @Length(2, 128)
    email: string

    @IsNotEmpty()
    @Length(2, 128)
    phone: string

    @IsNotEmpty()
    @IsString()
    telegram: string
}

export class AuthDto{
    @IsNotEmpty()
    @IsEmail()
    @Length(2, 128)
    email: string

    @IsNotEmpty()
    @IsString()
    @Length(8, 128, {message:'Пароль должен содержать минимум 8 символов'})
    password: string
}

export class UpdateDto{
    @IsString()
    login: string

    
    @IsEmail()
    @Length(2, 128)
    email: string

    @IsString()
    phone: string
}