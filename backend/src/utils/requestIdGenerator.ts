/**
 * Request ID Generator for EKSetu Gateway
 * Generates human-readable, trace-friendly IDs in the format:
 * REQ-YYYYMMDD-XXXXX (e.g. REQ-20260929-8F42A)
 */
export function generateRequestId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous characters like 0, O, 1, I
  let randomCode = '';
  for (let i = 0; i < 5; i++) {
    randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `REQ-${dateStr}-${randomCode}`;
}
