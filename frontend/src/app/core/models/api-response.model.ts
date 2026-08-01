export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiValidationError[] | null;
}

export interface ApiValidationError {
  field: string;
  message: string;
}