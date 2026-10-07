import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import { ROLES, type PermissionKey, type RoleName } from '../constants';
import type { User } from '../models';
import { userRepository } from '../repositories/user.repository';
import type { AuthResult, AuthUser, TokenClaims } from '../types/auth';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { tokenDenylist } from './tokenDenylist.service';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export function toAuthUser(user: User): AuthUser {
  const role = user.role!;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role.name as RoleName,
    permissions: (role as unknown as { permissions: { key: string }[] }).permissions.map((p) => p.key as PermissionKey),
  };
}

export const authService = {
  /** Public registration always creates an EMPLOYEE; admins come from the seeder. */
  async register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const role = await userRepository.findRoleByName(ROLES.EMPLOYEE);
    if (!role) throw new AppError(500, 'Server is not initialised (roles missing)');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    let created: User;
    try {
      created = await userRepository.create({ name: input.name, email: input.email, passwordHash, roleId: role.id });
    } catch (err) {
      if (err instanceof UniqueConstraintError) throw AppError.conflict('An account with this email already exists');
      throw err;
    }

    const user = toAuthUser((await userRepository.findById(created.id))!);
    return { token: signToken(user.id, user.role), user };
  },

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const record = await userRepository.findByEmail(input.email);
    const matches = await bcrypt.compare(input.password, record?.passwordHash ?? DUMMY_HASH);
    if (!record || !matches) throw AppError.unauthorized('Invalid email or password');

    const user = toAuthUser(record);
    return { token: signToken(user.id, user.role), user };
  },

  async logout(claims: TokenClaims): Promise<void> {
    await tokenDenylist.deny(claims.jti, claims.exp);
  },
};
