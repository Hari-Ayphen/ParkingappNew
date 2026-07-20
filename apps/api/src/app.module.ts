import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { TermsController } from './modules/terms/terms.controller';
import { UsersController } from './modules/users/users.controller';

/**
 * Feature modules land here as milestones ship (PROJECT_PLAN.md):
 *   v0.1  auth, terms, users          ← here
 *   v0.2  spaces
 *   v0.3  vehicles, bookings, sessions, realtime
 *   v0.4  notifications, ratings, support
 *   v0.5  billing, mandates, invoices
 */
@Module({
  imports: [AuthModule],
  controllers: [HealthController, TermsController, UsersController],
  providers: [],
})
export class AppModule {}
