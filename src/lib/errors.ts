export class AppError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const Errors = {
  exerciseLocked: (message = "This exercise is locked until its prerequisites are mastered.") =>
    new AppError("EXERCISE_LOCKED", message),
  notFound: (what: string) => new AppError("NOT_FOUND", `${what} was not found.`),
  validation: (message: string) => new AppError("VALIDATION_ERROR", message),
  noUser: () => new AppError("NO_USER", "No local profile exists yet. Complete onboarding first."),
  conflict: (message: string) => new AppError("CONFLICT", message),
};
