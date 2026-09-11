export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const Errors = {
  exerciseLocked: (message = "This exercise is locked until its prerequisites are mastered.") =>
    new AppError("EXERCISE_LOCKED", message, 403),
  notFound: (what: string) => new AppError("NOT_FOUND", `${what} was not found.`, 404),
  validation: (message: string, details?: unknown) =>
    new AppError("VALIDATION_ERROR", message, 422, details),
  noUser: () =>
    new AppError("NO_USER", "No local user profile exists yet. Complete onboarding first.", 404),
  conflict: (message: string) => new AppError("CONFLICT", message, 409),
};
