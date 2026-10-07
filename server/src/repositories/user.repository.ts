import { col, fn, where } from 'sequelize';
import { Role, User } from '../models';

const withRolePermissions = [
  { model: Role, as: 'role', include: [{ association: 'permissions', attributes: ['key'], through: { attributes: [] } }] },
];

export const userRepository = {
  /** Email lookups are case-insensitive (matches the unique index on lower(email)). */
  findByEmail(email: string) {
    return User.findOne({ where: where(fn('lower', col('email')), email.toLowerCase()), include: withRolePermissions });
  },

  findById(id: string) {
    return User.findByPk(id, { include: withRolePermissions });
  },

  create(data: { name: string; email: string; passwordHash: string; roleId: number }) {
    return User.create({ ...data, email: data.email.toLowerCase() });
  },

  findRoleByName(name: string) {
    return Role.findOne({ where: { name } });
  },
};
