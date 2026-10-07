'use strict';

// Demo accounts for local development / assessment review. Idempotent: existing emails are left untouched.
// Override via SEED_* env vars. Do NOT use these defaults in a real deployment.
const bcrypt = require('bcrypt');

const USERS = [
  {
    name: 'Admin User',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@company.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'ADMIN',
  },
  {
    name: 'Demo Employee',
    email: process.env.SEED_EMPLOYEE_EMAIL || 'employee@company.com',
    password: process.env.SEED_EMPLOYEE_PASSWORD || 'Employee@12345',
    role: 'EMPLOYEE',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const user of USERS) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      await queryInterface.sequelize.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         SELECT :name, :email, :passwordHash, r.id FROM roles r WHERE r.name = :role
         ON CONFLICT (lower(email)) DO NOTHING`,
        { replacements: { name: user.name, email: user.email.toLowerCase(), passwordHash, role: user.role } },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM users WHERE lower(email) IN (:emails)', {
      replacements: { emails: USERS.map((u) => u.email.toLowerCase()) },
    });
  },
};
