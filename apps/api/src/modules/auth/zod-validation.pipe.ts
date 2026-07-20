import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validates a body against a Zod schema and returns the parsed value.
 *
 * Field errors come back keyed by field so the client can map them onto inputs with
 * `setError` — an error the user cannot attach to a field is an error they cannot fix
 * (docs/design/design-system.md → error altitudes).
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const validationErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_';
      validationErrors[path] ??= issue.message;
    }
    throw new BadRequestException({
      message: 'Validation failed',
      validationErrors,
    });
  }
}
