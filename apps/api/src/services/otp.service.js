import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export function generateOtp() {
  const bytes = crypto.randomBytes(3);
  const num = (bytes.readUIntBE(0, 3) % 900000) + 100000;
  return num.toString();
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}
