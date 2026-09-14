import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      // Safe-by-default: no query result (flat or nested, e.g. a Student's
      // included `user`) ever carries the bcrypt hash unless a call site
      // explicitly opts back in with `omit: { passwordHash: false }` — see
      // AuthService.login and UsersService.verifyPassword, the only two
      // places that legitimately need it.
      omit: {
        user: {
          passwordHash: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
