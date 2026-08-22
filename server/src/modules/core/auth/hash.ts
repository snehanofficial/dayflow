import * as argon2 from 'argon2';

/**
 * Secures a password using argon2 (argon2id variant).
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/**
 * Validates a password against its argon2 hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
export default { hashPassword, verifyPassword };
