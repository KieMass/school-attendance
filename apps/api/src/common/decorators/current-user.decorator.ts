import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
  /** Role-specific profile id (Student.id, Parent.id, etc.), attached by
   * JwtStrategy so handlers don't need an extra lookup for common cases. */
  profileId?: string;
  email?: string | null;
}

/** Injects the authenticated user attached by JwtAuthGuard, e.g.
 * `@CurrentUser() user: AuthenticatedUser`. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    return data ? user?.[data] : user;
  },
);
