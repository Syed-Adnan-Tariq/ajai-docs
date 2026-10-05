import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export const DEMO_PASSWORD = 'password123';

const SEED_USERS = [
  { email: 'alice@example.com', name: 'Alice Anderson' },
  { email: 'bob@example.com', name: 'Bob Brown' },
  { email: 'carol@example.com', name: 'Carol Chen' },
];

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  /** Seeds demo accounts on boot (idempotent) so reviewers can test sharing immediately. */
  async onModuleInit() {
    for (const seed of SEED_USERS) {
      const exists = await this.users.findOne({ where: { email: seed.email } });
      if (!exists) {
        await this.users.save(
          this.users.create({ ...seed, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 8) }),
        );
        this.logger.log(`Seeded demo user ${seed.email}`);
      }
    }
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  listDemoUsers() {
    return this.users.find({ select: { id: true, email: true, name: true }, order: { name: 'ASC' } });
  }
}
