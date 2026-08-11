export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_MULTIPART_OVERHEAD_BYTES = 250_000;

const ALLOWED_FILES: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "text/plain": ["txt", "md"],
  "text/markdown": ["md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

type FileValidationFailure = { ok: false; code: string; message: string; status: number };
type FileValidationSuccess = { ok: true; file: File; bytes: ArrayBuffer; originalName: string };

export async function validateUploadedFile(entry: FormDataEntryValue | null): Promise<FileValidationFailure | FileValidationSuccess> {
  if (!(entry instanceof File)) return failure("FILE_REQUIRED", "Selecione um arquivo.", 422);
  if (entry.size === 0 || entry.size > MAX_FILE_BYTES) return failure("FILE_SIZE_INVALID", "O arquivo deve ter entre 1 byte e 5 MB.", 422);

  const originalName = safeFileName(entry.name);
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FILES[entry.type]?.includes(extension)) {
    return failure("FILE_TYPE_NOT_ALLOWED", "Envie PDF, PNG, JPG, TXT, Markdown ou DOCX.", 422);
  }

  const bytes = await entry.arrayBuffer();
  if (!hasExpectedSignature(entry.type, new Uint8Array(bytes))) {
    return failure("FILE_SIGNATURE_INVALID", "O conteúdo do arquivo não corresponde ao formato informado.", 422);
  }
  return { ok: true, file: entry, bytes, originalName };
}

export function exceedsMultipartLimit(request: Request) {
  return Number(request.headers.get("content-length") ?? 0) > MAX_FILE_BYTES + MAX_MULTIPART_OVERHEAD_BYTES;
}

function safeFileName(value: string) {
  const base = value.split(/[\\/]/).pop() || "arquivo";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "arquivo";
}

function hasExpectedSignature(contentType: string, bytes: Uint8Array) {
  if (contentType === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (contentType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType.includes("wordprocessingml")) return bytes[0] === 0x50 && bytes[1] === 0x4b;
  return contentType === "text/plain" || contentType === "text/markdown";
}

function failure(code: string, message: string, status: number): FileValidationFailure {
  return { ok: false, code, message, status };
}
