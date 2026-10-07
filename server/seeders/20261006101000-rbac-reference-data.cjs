'use strict';

// Reference data (roles, permissions, role->permission mapping). Idempotent: safe to re-run.
const ROLES = ['ADMIN', 'EMPLOYEE'];

const PERMISSIONS = [
  'requests.read',
  'requests.create',
  'requests.update',
  'requests.delete',
  'requests.status.update',
  'dashboard.read',
];

const ROLE_PERMISSIONS = {
  ADMIN: PERMISSIONS,
  EMPLOYEE: ['requests.read', 'requests.create', 'requests.update', 'dashboard.read'],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    for (const name of ROLES) {
      await sequelize.query('INSERT INTO roles (name) VALUES (:name) ON CONFLICT (name) DO NOTHING', {
        replacements: { name },
      });
    }
    for (const key of PERMISSIONS) {
      await sequelize.query('INSERT INTO permissions (key) VALUES (:key) ON CONFLICT (key) DO NOTHING', {
        replacements: { key },
      });
    }
    for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
      for (const key of keys) {
        await sequelize.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = :role AND p.key = :key
           ON CONFLICT DO NOTHING`,
          { replacements: { role, key } },
        );
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM role_permissions');
    await queryInterface.sequelize.query('DELETE FROM permissions');
    await queryInterface.sequelize.query('DELETE FROM roles');
  },
};
