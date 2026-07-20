import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Put,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { user } from '../../db/schema/identity';
import { completeProfileSchema, type CompleteProfileDto } from '../auth/auth.dto';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';

/** docs/features/02-after-login-flow.md, 15-profile-flow.md */
@Controller('users')
export class UsersController {
  @Get('me')
  async me(@Headers('x-user-id') userId?: string) {
    if (!userId) throw new UnauthorizedException();
    const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!row) throw new NotFoundException();
    return this.publicShape(row);
  }

  @Put('me/complete-profile')
  @UsePipes(new ZodValidationPipe(completeProfileSchema))
  async completeProfile(@Body() body: CompleteProfileDto, @Headers('x-user-id') userId?: string) {
    if (!userId) throw new UnauthorizedException();

    const [row] = await db
      .update(user)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        upiId: body.upiId,
        isProfileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    if (!row) throw new NotFoundException();
    return this.publicShape(row);
  }

  /**
   * Never return another user's phone or UPI ID. The UPI ID is only ever used server-side to
   * render an exit QR (docs/features/12-exit-verification-flow.md) — it is not a public field,
   * and leaking it would let anyone request money from an owner out of band.
   */
  private publicShape(row: typeof user.$inferSelect) {
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      photoUrl: row.photoUrl,
      isProfileComplete: row.isProfileComplete,
    };
  }
}
