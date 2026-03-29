import { DocumentBuilder } from "@nestjs/swagger";

export function getSwaggerConfig(){
    return new DocumentBuilder()
    .setTitle('ZUBRothers Backend API')
    .setDescription('API для официального веб-сайта ОО "ЗУБРазерс"')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
}