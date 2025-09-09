export interface APIResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Type guard for API Response
export function isAPIResponse<T>(response: any): response is APIResponse<T> {
  return response && 'data' in response;
}

// Type guard for array
export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}


