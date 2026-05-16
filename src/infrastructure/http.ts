export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function postJson<TResponse, TRequest>(
  url: string,
  body: TRequest,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as TResponse;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (Array.isArray(payload.detail)) {
      return payload.detail
        .map((entry) => {
          if (typeof entry === 'object' && entry && 'msg' in entry) {
            return String((entry as { msg: unknown }).msg);
          }
          return String(entry);
        })
        .join(', ');
    }
    if (payload.detail) {
      return String(payload.detail);
    }
  } catch {
    return `API request failed with status ${response.status}`;
  }
  return `API request failed with status ${response.status}`;
}

