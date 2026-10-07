'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(30), allowNull: false, unique: true },
    });

    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: Sequelize.STRING(60), allowNull: false, unique: true },
    });

    await queryInterface.createTable('role_permissions', {
      role_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onDelete: 'CASCADE',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
  },
};
