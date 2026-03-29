import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionFilter implements ExceptionFilter{
    private readonly logger = new Logger(AllExceptionFilter.name)
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse() as Response;
        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const message = exception instanceof HttpException ? exception.message : 'Internal Server Error';
        const trace = exception.stack

        if(status >= 400 && status < 500){
            this.logger.warn(message, exception, trace);
        }
        else{
            this.logger.error(message, exception, trace);
        }

        response.status(status).json({
            status,
            message,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
        })
    }
}