'use strict';

// "Overdue" means: OPEN or IN_PROGRESS for more than 24h *in the current status*.
// created_at/updated_at cannot express that (updated_at moves on every edit), so we track when
// the status last changed. Existing rows have no history, so they are backfilled with created_at.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('service_requests', 'status_changed_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('now()'),
    });
    await queryInterface.sequelize.query('UPDATE service_requests SET status_changed_at = created_at');
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('service_requests', 'status_changed_at');
  },
};
