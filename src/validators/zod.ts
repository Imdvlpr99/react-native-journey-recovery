export interface ZodIssueLike {
  message: string;
  path?: Array<string | number>;
}

export interface ZodErrorLike {
  message?: string;
  issues?: ZodIssueLike[];
}

export interface ZodSafeParseSuccess<T> {
  success: true;
  data: T;
}

export interface ZodSafeParseError {
  success: false;
  error: ZodErrorLike;
}

export type ZodSafeParseResult<T> = ZodSafeParseSuccess<T> | ZodSafeParseError;

export interface ZodSchemaLike<T = any> {
  safeParse: (data: unknown) => ZodSafeParseResult<T>;
}

/**
 * Creates a type-guard validation function from a Zod schema (or compatible standard validator).
 * Can be passed directly to `options.validate` when registering a journey.
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { createZodValidator } from 'react-native-journey-recovery';
 *
 * const CheckoutSchema = z.object({
 *   cartId: z.string(),
 *   step: z.enum(['shipping', 'payment']),
 *   total: z.number().positive(),
 * });
 *
 * const journey = useJourney('checkout', {
 *   validate: createZodValidator(CheckoutSchema),
 * });
 * ```
 */
export function createZodValidator<T>(schema: ZodSchemaLike<T>): (data: unknown) => data is T {
  return (data: unknown): data is T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const issueDetails = result.error?.issues
        ?.map((issue) => `${issue.path && issue.path.length > 0 ? issue.path.join('.') : 'root'}: ${issue.message}`)
        .join('; ');

      const errorMessage = issueDetails || result.error?.message || 'Schema validation rejected snapshot payload';
      throw new Error(`Zod validation failed: ${errorMessage}`);
    }
    return true;
  };
}

