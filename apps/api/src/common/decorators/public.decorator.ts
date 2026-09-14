import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as exempt from the global JWT auth guard (e.g. login,
 * refresh, health check). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
