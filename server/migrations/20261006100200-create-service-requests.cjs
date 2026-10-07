'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_requests', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      title: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      category: { type: Sequelize.STRING(20), allowNull: false },
      priority: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'MEDIUM' },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'OPEN' },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });

    await queryInterface.addConstraint('service_requests', {
      type: 'check',
      name: 'service_requests_category_chk',
      fields: ['category'],
      where: { category: ['IT', 'MAINTENANCE', 'GENERAL'] },
    });
    await queryInterface.addConstraint('service_requests', {
      type: 'check',
      name: 'service_requests_priority_chk',
      fields: ['priority'],
      where: { priority: ['LOW', 'MEDIUM', 'HIGH'] },
    });
    await queryInterface.addConstraint('service_requests', {
      type: 'check',
      name: 'service_requests_status_chk',
      fields: ['status'],
      where: { status: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] },
    });

    await queryInterface.addIndex('service_requests', ['status'], { name: 'service_requests_status_idx' });
    await queryInterface.addIndex('service_requests', ['priority'], { name: 'service_requests_priority_idx' });
    await queryInterface.addIndex('service_requests', ['created_by'], { name: 'service_requests_created_by_idx' });
    await queryInterface.sequelize.query(
      'CREATE INDEX service_requests_created_at_idx ON service_requests (created_at DESC)',
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_requests');
  },
};
