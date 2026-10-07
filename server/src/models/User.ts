import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { Role } from './Role';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare roleId: ForeignKey<Role['id']>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare role?: NonAttribute<Role>;
}

User.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'users' },
);
