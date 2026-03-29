import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../guard/jwt.guard";
import { RolesGuard } from "../guard/roles.guard";

export const ROLES_KEY = 'roles';

export function Authorization(...roles: string[]){
    return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(JwtGuard, RolesGuard))
}