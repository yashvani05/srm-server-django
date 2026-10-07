'use strict';

// Sample service requests so a fresh install has something to look at, including overdue examples.
// Idempotent: a request is only inserted if one with the same title does not exist yet.
// `age` is how long ago the request was created and entered its current status. Rows older than 24h that are not
// resolved are seeded already flagged `overdue`, exactly as the overdue worker would have flagged them.
// Owners are the demo users, whose emails can be overridden with the same SEED_* variables as the user seeder.
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@company.com').toLowerCase();
const EMPLOYEE_EMAIL = (process.env.SEED_EMPLOYEE_EMAIL || 'employee@company.com').toLowerCase();

const SAMPLES = [
  { title: 'Laptop screen flickers on battery', category: 'IT', priority: 'HIGH', status: 'OPEN', age: '30 hours', owner: 'employee', description: 'The screen flickers whenever the laptop is unplugged. Started after the last Windows update.' },
  { title: 'VPN disconnects every few minutes', category: 'IT', priority: 'HIGH', status: 'IN_PROGRESS', age: '52 hours', owner: 'employee', description: 'Working from home, the VPN drops roughly every 5 minutes and I have to reconnect manually.' },
  { title: 'Request access to the shared finance drive', category: 'IT', priority: 'MEDIUM', status: 'OPEN', age: '5 hours', owner: 'employee', description: 'I have moved to the finance team and need read access to the shared finance drive.' },
  { title: 'Replace broken chair in meeting room 3', category: 'MAINTENANCE', priority: 'LOW', status: 'OPEN', age: '2 days', owner: 'employee', description: 'One of the chairs in meeting room 3 has a broken gas lift and sinks when sat on.' },
  { title: 'Air conditioning too cold on 2nd floor', category: 'MAINTENANCE', priority: 'MEDIUM', status: 'IN_PROGRESS', age: '9 hours', owner: 'employee', description: 'The east side of the 2nd floor is uncomfortably cold in the mornings.' },
  { title: 'Leaking tap in the kitchen', category: 'MAINTENANCE', priority: 'HIGH', status: 'RESOLVED', age: '4 days', owner: 'admin', description: 'The mixer tap in the ground floor kitchen drips constantly.' },
  { title: 'Order extra monitors for new starters', category: 'GENERAL', priority: 'MEDIUM', status: 'IN_PROGRESS', age: '3 days', owner: 'admin', description: 'Three new starters join next month and each needs a second monitor.' },
  { title: 'Update the office visitor policy', category: 'GENERAL', priority: 'LOW', status: 'OPEN', age: '1 hour', owner: 'admin', description: 'The visitor policy on the intranet still references the old reception desk process.' },
  { title: 'Printer on 1st floor jams constantly', category: 'IT', priority: 'MEDIUM', status: 'RESOLVED', age: '6 days', owner: 'employee', description: 'Paper jams on nearly every job. Tray 2 seems to be the culprit.' },
  { title: 'Request a standing desk', category: 'GENERAL', priority: 'LOW', status: 'RESOLVED', age: '8 days', owner: 'employee', description: 'Ergonomic assessment recommended a standing desk.' },
  { title: 'Wi-Fi drops in the north corridor', category: 'IT', priority: 'HIGH', status: 'OPEN', age: '26 hours', owner: 'admin', description: 'Dead spot near the north corridor stairwell; video calls cut out.' },
  { title: 'Light fitting flickering in reception', category: 'MAINTENANCE', priority: 'LOW', status: 'OPEN', age: '20 hours', owner: 'employee', description: 'The downlight above the reception desk flickers intermittently.' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    for (const s of SAMPLES) {
      await sequelize.query(
        `INSERT INTO service_requests
           (title, description, category, priority, status, created_by, created_at, updated_at, status_changed_at, overdue, overdue_at)
         SELECT :title, :description, :category, :priority, :status, u.id,
                now() - CAST(:age AS interval), now() - CAST(:age AS interval), now() - CAST(:age AS interval),
                (:status IN ('OPEN', 'IN_PROGRESS') AND CAST(:age AS interval) > interval '24 hours'),
                CASE WHEN :status IN ('OPEN', 'IN_PROGRESS') AND CAST(:age AS interval) > interval '24 hours' THEN now() END
         FROM users u
         WHERE u.email = :email
           AND NOT EXISTS (SELECT 1 FROM service_requests r WHERE r.title = :title)`,
        { replacements: { ...s, email: s.owner === 'admin' ? ADMIN_EMAIL : EMPLOYEE_EMAIL } },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM service_requests WHERE title IN (:titles)', {
      replacements: { titles: SAMPLES.map((s) => s.title) },
    });
  },
};
