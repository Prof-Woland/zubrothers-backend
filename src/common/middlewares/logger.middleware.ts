import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction } from "express";
import { AllLogger } from "../log/logger.log";

@Injectable()
export class LoggingMiddleware implements NestMiddleware{
    private readonly logger = new AllLogger()
    use(req: Request, res: Response, next: NextFunction) {
        this.logger.log(req.method + ' request: ' + req.url, '');
        next()
    }
}