'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });

    // Case-insensitive uniqueness for emails.
    await queryInterface.sequelize.query('CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email))');
    await queryInterface.addIndex('users', ['role_id'], { name: 'users_role_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
