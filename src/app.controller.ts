import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Authorization } from './auth/decorators/authorization.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Authorization("MEMBER")
  getHello(): string {
    return this.appService.getHello();
  }
}
