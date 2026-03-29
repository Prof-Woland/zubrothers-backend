import { ConsoleLogger, LoggerService, LogLevel } from "@nestjs/common";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";

export class AllLogger implements LoggerService{
    private readonly consoleLogger = new ConsoleLogger()

    log(message: any, ctx: string){
        this.writeToFile('log', message, ctx);
        this.consoleLogger.log(message, ctx);
    }

    warn(message: any, ctx: string, trace?: string){
        this.writeToFile('warn', message, ctx, trace);
        this.consoleLogger.warn(message, ctx);
    }

    debug(message: any, ctx: string){
        this.writeToFile('debug', message, ctx);
        this.consoleLogger.debug(message, ctx);
    }

    verbose(message: any, ctx: string){
        this.writeToFile('verbose', message, ctx);
        this.consoleLogger.verbose(message, ctx);
    }

    error(message: any, ctx?: string, trace?: string){
        this.writeToFile('error', message, ctx, trace);
        this.consoleLogger.error(message, trace, ctx);
    }

    private writeToFile(level: LogLevel, message: any, ctx?: string, trace?: string){
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 т.к. месяцы 0-11
        const day = String(now.getDate()).padStart(2, '0');
        const time = new Date().toISOString();
        const log = `[${time}] [${level}] ${ctx? ` [${ctx}]` : ''} ${message} ${trace? `\nTRACE: ${trace}`: ''}\n`;
        const logFile = join(__dirname, `./../../logs/${year}${month}${day}.log`);
        const logDir = dirname(logFile);
        if(!existsSync(logDir)){
            mkdirSync(logDir, {recursive: true})
        }

        appendFileSync(logFile, log);
    };


}