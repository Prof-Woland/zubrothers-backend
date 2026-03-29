import { INestApplication } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import { getSwaggerConfig } from "src/config/swagger.config";

export function setupSwagger(app: INestApplication){
    const config = getSwaggerConfig();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/swagger/docs', app, document, {
        jsonDocumentUrl: '/swagger/json',
    });
}