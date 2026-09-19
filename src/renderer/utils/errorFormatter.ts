/**
 * Medix Operator-Friendly Error Formatting Utility
 * Translates HTTP, network, and application errors into clear, actionable, plain-language messages.
 * Never leaks raw database syntax, Prisma query traces, or server internals to operators.
 */

interface ErrorResponsePayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
}

/**
 * Checks if a string contains internal database / framework syntax that should never be shown to operators.
 */
function isInternalServerDetail(msg: string): boolean {
  const sensitivePatterns = [
    /prisma/i,
    /foreign key constraint/i,
    /unique constraint failed/i,
    /invalid `prisma\./i,
    /syntax error in sql/i,
    /column .* does not exist/i,
    /relation .* does not exist/i,
    /stack trace/i,
    /at async/i,
    /cannot read properties of undefined/i,
    /nullpointer/i,
  ];
  return sensitivePatterns.some((pattern) => pattern.test(msg));
}

/**
 * Maps known application error messages / codes to operator-friendly text.
 */
function mapKnownErrorMessage(rawMessage: string): string | null {
  const normalized = rawMessage.toLowerCase().trim();

  // Connection & Network
  if (
    normalized.includes('network error') ||
    normalized.includes('econnrefused') ||
    normalized.includes('err_connection_refused') ||
    normalized.includes('failed to fetch')
  ) {
    return 'Cannot connect to the server. Please check your network connection or verify the main system is running.';
  }

  if (normalized.includes('timeout') || normalized.includes('etimedout')) {
    return 'The server took too long to respond. Please try again in a few moments.';
  }

  // Authentication & Sessions
  if (
    normalized.includes('unauthorized') ||
    normalized.includes('token expired') ||
    normalized.includes('jwt expired') ||
    normalized.includes('invalid token')
  ) {
    return 'Your login session has expired. Please log in again to continue.';
  }

  if (
    normalized.includes('forbidden') ||
    normalized.includes('access denied') ||
    normalized.includes('insufficient permissions')
  ) {
    return 'You do not have permission to perform this action. Please check with your supervisor.';
  }

  // Financial & Khata Rules
  if (normalized.includes('credit limit') || normalized.includes('credit exceeded')) {
    return 'Customer credit limit is exceeded. Please collect payment or get supervisor approval.';
  }

  if (normalized.includes('till session') || normalized.includes('till is required') || normalized.includes('till closed')) {
    return 'A cash counter session must be open to process cash transactions. Please open your cash counter.';
  }

  // Inventory & Batches
  if (normalized.includes('insufficient stock') || normalized.includes('insufficient batch quantity') || normalized.includes('not enough stock')) {
    return 'Insufficient stock available for this medicine or batch.';
  }

  if (normalized.includes('expired batch') || normalized.includes('batch has expired') || normalized.includes('expiry must be in the future')) {
    return 'This medicine batch is expired or has an invalid expiry date.';
  }

  // Duplication & Conflicts
  if (normalized.includes('already exists') || normalized.includes('duplicate entry') || normalized.includes('unique constraint')) {
    return 'A record with this code, number, or title already exists. Please use a unique identifier.';
  }

  // In Use / Reference Blockers
  if (normalized.includes('cannot delete') || normalized.includes('is being used') || normalized.includes('foreign key')) {
    return 'This record cannot be removed because it is referenced in transactions or active stock.';
  }

  return null;
}

/**
 * Standardizes any error into a concise, actionable, operator-friendly message.
 */
export function formatApiErrorMessage(
  error: unknown,
  fallbackMessage: string = 'An error occurred while processing your request. Please try again.',
): string {
  if (!error) {
    return fallbackMessage;
  }

  // If already a clean user-intended string
  if (typeof error === 'string') {
    const mapped = mapKnownErrorMessage(error);
    if (mapped) return mapped;
    if (isInternalServerDetail(error)) return fallbackMessage;
    return error.trim() || fallbackMessage;
  }

  // Handle Axios / Fetch response objects
  const errObj = error as {
    response?: {
      data?: ErrorResponsePayload;
      status?: number;
      statusText?: string;
    };
    message?: string;
    code?: string;
  };

  const responseData = errObj.response?.data;
  const httpStatus = errObj.response?.status;

  // 1. Check API response body messages
  if (responseData) {
    let rawMsg: string | undefined;

    if (Array.isArray(responseData.message)) {
      rawMsg = responseData.message.join(' | ');
    } else if (typeof responseData.message === 'string') {
      rawMsg = responseData.message;
    } else if (typeof responseData.error === 'string') {
      rawMsg = responseData.error;
    }

    if (rawMsg) {
      const mapped = mapKnownErrorMessage(rawMsg);
      if (mapped) return mapped;

      // Filter out internal server leaks
      if (!isInternalServerDetail(rawMsg)) {
        return rawMsg.trim();
      }
    }
  }

  // 2. Check top-level error object code/message
  if (errObj.message) {
    const mapped = mapKnownErrorMessage(errObj.message);
    if (mapped) return mapped;
  }

  // 3. Fallback based on HTTP status code
  if (httpStatus) {
    switch (httpStatus) {
      case 400:
        return 'The entered information is invalid or incomplete. Please check the highlighted fields.';
      case 401:
        return 'Your login session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested record or document could not be found.';
      case 409:
        return 'A record with this information already exists. Please review your input.';
      case 422:
        return 'Some of the submitted details are invalid. Please check your entries.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'The server encountered an issue. Please try again in a moment.';
      default:
        break;
    }
  }

  return fallbackMessage;
}
