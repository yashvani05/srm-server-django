import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';
import { sequelize } from '../config/database';

export class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<number>;
  declare key: string;
}

Permission.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'permissions', timestamps: false },
);
