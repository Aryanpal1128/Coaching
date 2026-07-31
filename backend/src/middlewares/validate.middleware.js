import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      const formattedErrors = error.errors
        ? error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        : [error.message];

      next(new ApiError(400, 'Validation Error', formattedErrors));
    }
  };
};
