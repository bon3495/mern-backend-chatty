import { Request } from 'express';
import { ObjectSchema } from 'joi';
import { JoiRequestValidationError } from '@global/helpers/error-handler';

type IJoiDecorator = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  key: string,
  descriptor: PropertyDescriptor
) => void;

export function joiValidation(schema: ObjectSchema): IJoiDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];

      // validateAsync or validate
      const { error } = await Promise.resolve(schema.validate(req.body));
      /**
       * if (error?.detail?) {
       *  error?.details = [{
                              message: 'error message...',
                              path: [Array],
                              type: 'string.min',
                              context: [Object]
                            }]
       * }
       */
      if (error?.details) {
        throw new JoiRequestValidationError(error.details[0].message);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
