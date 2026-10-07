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
import {
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  type RequestCategory,
  type RequestPriority,
  type RequestStatus,
} from '../constants';
import type { User } from './User';

export class ServiceRequest extends Model<InferAttributes<ServiceRequest>, InferCreationAttributes<ServiceRequest>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare description: string;
  declare category: RequestCategory;
  declare priority: CreationOptional<RequestPriority>;
  declare status: CreationOptional<RequestStatus>;
  /** When `status` last changed. Drives the overdue rule (time spent in the current status). */
  declare statusChangedAt: CreationOptional<Date>;
  /** Maintained by the overdue worker; cleared immediately whenever the status changes. */
  declare overdue: CreationOptional<boolean>;
  declare overdueAt: CreationOptional<Date | null>;
  declare createdBy: ForeignKey<User['id']>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare creator?: NonAttribute<User>;
}

ServiceRequest.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [[...REQUEST_CATEGORIES]] } },
    priority: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'MEDIUM',
      validate: { isIn: [[...REQUEST_PRIORITIES]] },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'OPEN',
      validate: { isIn: [[...REQUEST_STATUSES]] },
    },
    statusChangedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    overdue: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    overdueAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'service_requests' },
);
