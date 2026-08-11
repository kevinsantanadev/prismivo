import { apiError, apiSuccess } from "@/lib/api";
import type { MutationResult } from "./mutations";

export function supabaseMutationResponse<T>(result: MutationResult<T>, successStatus = 200) {
  return result.ok
    ? apiSuccess(result.data, { status: successStatus })
    : apiError(result.code, result.message, result.status);
}
