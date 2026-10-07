import { OVERDUE_AFTER_HOURS } from '../constants';

/**
 * The single definition of "overdue", as a SQL boolean over service_requests columns:
 * OPEN or IN_PROGRESS for more than OVERDUE_AFTER_HOURS in the current status (database clock).
 * Used by the overdue worker. The constant is code-owned, never user input, so interpolating it is safe.
 */
export const OVERDUE_CONDITION = `(status IN ('OPEN', 'IN_PROGRESS') AND status_changed_at < now() - interval '${OVERDUE_AFTER_HOURS} hours')`;
