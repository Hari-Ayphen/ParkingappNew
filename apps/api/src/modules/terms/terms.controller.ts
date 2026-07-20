import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { db } from '../../db/client';
import { termsAcceptance, termsVersion } from '../../db/schema/identity';
import { acceptTermsSchema, type AcceptTermsDto } from '../auth/auth.dto';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';

/**
 * docs/features/19-terms-acceptance-flow.md
 *
 * Acceptance is a **compliance record**, not a UI gate: the version and timestamp are stored
 * permanently against the user and this table is append-only. There is deliberately no
 * update or delete endpoint.
 */
@Controller('legal')
export class TermsController {
  @Get('terms-version')
  async currentVersion(): Promise<{ version: string; bodyUrl: string; publishedAt: Date }> {
    const [row] = await db
      .select()
      .from(termsVersion)
      .orderBy(desc(termsVersion.publishedAt))
      .limit(1);
    if (!row) throw new NotFoundException('No terms version published');
    return { version: row.version, bodyUrl: row.bodyUrl, publishedAt: row.publishedAt };
  }

  @Post('accept-terms')
  @UsePipes(new ZodValidationPipe(acceptTermsSchema))
  async accept(
    @Body() body: AcceptTermsDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ accepted: true; version: string }> {
    // TODO(v0.1-D): replace the header with the authenticated principal once tokens are real.
    if (!userId) throw new UnauthorizedException();

    const [version] = await db
      .select()
      .from(termsVersion)
      .where(eq(termsVersion.version, body.termsVersion))
      .limit(1);
    if (!version) throw new NotFoundException('Unknown terms version');

    await db.insert(termsAcceptance).values({
      id: uuidv7(),
      userId,
      termsVersionId: version.id,
      acceptedAt: new Date(),
    });

    return { accepted: true, version: version.version };
  }
}
