/** Uppercase alphanumerics without easily confused characters (I, O, 0, 1). */
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAccessCode(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return out;
}
