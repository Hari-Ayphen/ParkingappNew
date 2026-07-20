import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InMemoryOtpStore, type OtpStore } from './otp.store';

/**
 * OTP storage is injected so the flow is testable without infrastructure. In production this
 * binds to Redis with a TTL; the in-memory store is a dev/test convenience and must never be
 * the production binding — it does not survive a restart and does not share across instances.
 *
 * TODO(v0.1-D): bind `OTP_STORE` to a Redis implementation when REDIS_URL is wired.
 */
export const OTP_STORE = Symbol('OTP_STORE');

@Module({
  controllers: [AuthController],
  providers: [
    { provide: OTP_STORE, useFactory: (): OtpStore => new InMemoryOtpStore() },
    {
      provide: AuthService,
      useFactory: (store: OtpStore): AuthService => new AuthService(store),
      inject: [OTP_STORE],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
