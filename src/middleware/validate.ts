import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Part = 'body' | 'query' | 'params';

/** Validates and coerces a request part against a Zod schema. */
export const validate =
  (schema: ZodSchema, part: Part = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      // Overwrite with the parsed (coerced/stripped) value.
      (req as unknown as Record<Part, unknown>)[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        next(new AppError('Validation failed', 422, details));
      } else {
        next(err);
      }
    }
  };
