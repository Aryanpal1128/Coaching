catch (error) {
  console.error("========== ZOD ERROR ==========");
  console.error(JSON.stringify(error.errors, null, 2));

  const formattedErrors = error.errors
    ? error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }))
    : [error.message];

  next(new ApiError(400, "Validation Error", formattedErrors));
}