import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { db } from '../../db/client';
import { country } from '../../db/schema/identity';
import { AuthService } from './auth.service';
import {
  requestOtpSchema,
  verifyOtpSchema,
  type RequestOtpDto,
  type VerifyOtpDto,
} from './auth.dto';
import { ZodValidationPipe } from './zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** The country picker on the Login screen. docs/features/01-login-flow.md */
  @Get('countries')
  async countries(): Promise<{ id: string; iso2: string; name: string; dialCode: string }[]> {
    return db
      .select({
        id: country.id,
        iso2: country.iso2,
        name: country.name,
        dialCode: country.dialCode,
      })
      .from(country)
      .orderBy(country.name);
  }

  @Post('request-otp')
  @UsePipes(new ZodValidationPipe(requestOtpSchema))
  async requestOtp(@Body() body: RequestOtpDto) {
    return this.auth.requestOtp(body.countryId, body.phone);
  }

  @Post('verify-otp')
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.auth.verifyOtp(body.countryId, body.phone, body.otp);
  }
}
