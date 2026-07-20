import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Feature modules land here as milestones ship (PROJECT_PLAN.md):
 *   v0.1  auth, users, terms
 *   v0.2  spaces
 *   v0.3  vehicles, bookings, sessions, realtime
 *   v0.4  notifications, ratings, support
 *   v0.5  billing, mandates, invoices
 */
@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
