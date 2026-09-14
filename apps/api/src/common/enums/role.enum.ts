/** Mirrors the Prisma `Role` enum; kept separate so non-Prisma layers
 * (guards, decorators, DTOs) don't need to import generated client types. */
export enum Role {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SECURITY = 'SECURITY',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}
