/**
 * Shared auth helper for sync endpoints.
 * Cron endpoints validate CRON_SECRET bearer token.
 * Trigger endpoint validates admin session.
 */

import { CRON_SECRET } from '$env/static/private';

export function validateCronSecret(request: Request): boolean {
	const auth = request.headers.get('authorization');
	if (!auth) return false;
	return auth === `Bearer ${CRON_SECRET}`;
}
