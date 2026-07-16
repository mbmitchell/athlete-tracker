type SupabaseResult<T> = {
  data: T;
  error: { message: string } | null;
};

export function requireSupabaseResult<T>(result: SupabaseResult<T>, context: string): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }

  return result.data;
}
