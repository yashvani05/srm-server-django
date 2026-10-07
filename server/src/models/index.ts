import { Permission } from './Permission';
import { Role } from './Role';
import { ServiceRequest } from './ServiceRequest';
import { User } from './User';

// Associations live in one place so the relationship graph is easy to read.
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Role.belongsToMany(Permission, {
  through: 'role_permissions',
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
  timestamps: false,
});
Permission.belongsToMany(Role, {
  through: 'role_permissions',
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
  timestamps: false,
});

User.hasMany(ServiceRequest, { foreignKey: 'createdBy', as: 'requests' });
ServiceRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

export { Permission, Role, ServiceRequest, User };
