import { createHmac } from "crypto";

export function hashPhone(phone: string): string {
  return createHmac("sha256", process.env.PHONE_HASH_SECRET!)
    .update(phone.trim())
    .digest("hex");
}
