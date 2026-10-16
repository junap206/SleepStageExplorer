// Where the backend lives. NEXT_PUBLIC_ variables are copied into the code
// that runs in the visitor's browser, so never put a secret in one.
export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const DISCLAIMER =
  "Research estimates from a wrist-worn device. Not a medical diagnosis.";