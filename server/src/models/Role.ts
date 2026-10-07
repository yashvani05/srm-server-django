import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<number>;
  declare name: string;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'roles', timestamps: false },
);
