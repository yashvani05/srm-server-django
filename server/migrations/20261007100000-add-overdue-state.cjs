'use strict';

// Question 2: persisted overdue state + a place to record the last successful overdue-check run.
//   service_requests.overdue     - maintained by the overdue worker; cleared immediately on any status change
//   service_requests.overdue_at  - when the worker first flagged it (NULL while not overdue)
//   system_state                 - small key/value table; `overdue_check.last_success_at` lives here
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('service_requests', 'overdue', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('service_requests', 'overdue_at', { type: Sequelize.DATE, allowNull: true });

    await queryInterface.createTable('system_state', {
      key: { type: Sequelize.STRING(100), primaryKey: true },
      value: { type: Sequelize.TEXT, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });

    // Rows that are already past the threshold at migration time start out flagged.
    await queryInterface.sequelize.query(`
      UPDATE service_requests SET overdue = true, overdue_at = now()
      WHERE status IN ('OPEN', 'IN_PROGRESS') AND status_changed_at < now() - interval '24 hours'
    `);

    // Worker scan: only open/in-progress rows that are not flagged yet.
    await queryInterface.sequelize.query(`
      CREATE INDEX service_requests_overdue_candidates_idx ON service_requests (status_changed_at)
      WHERE status IN ('OPEN', 'IN_PROGRESS') AND overdue = false
    `);
    // Dashboard count and the ?overdue=true list filter.
    await queryInterface.sequelize.query('CREATE INDEX service_requests_overdue_idx ON service_requests (created_at DESC) WHERE overdue = true');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS service_requests_overdue_idx');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS service_requests_overdue_candidates_idx');
    await queryInterface.dropTable('system_state');
    await queryInterface.removeColumn('service_requests', 'overdue_at');
    await queryInterface.removeColumn('service_requests', 'overdue');
  },
};
