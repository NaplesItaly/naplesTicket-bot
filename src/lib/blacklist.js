const postgres = require('postgres');

// The blacklist lives in naples-bot's PostgreSQL database (managed by its /blacklist and /unblacklist
// commands) — read directly so there is a single source of truth. Unset = check disabled.
const sql = process.env.NAPLES_DB_URL
	? postgres(process.env.NAPLES_DB_URL, {
		connect_timeout: 2,
		idle_timeout: 60,
		max: 2,
	})
	: null;

/**
 * Same rule as naples-bot's `blacklist.getByUtente`, plus rows that only carry the Discord ID
 * (e.g. escalated from a report whose target was never resolved to an `utente`).
 * @param {string} discordUserId
 * @returns {Promise<boolean>}
 */
module.exports.isBlacklisted = async discordUserId => {
	if (!sql) return false;
	const rows = await sql`
		SELECT 1
		FROM blacklist b
		LEFT JOIN utente u ON u.id = b.utente_id
		WHERE b.active = true AND (u.discord_user_id = ${discordUserId} OR b.discord_user_id = ${discordUserId})
		LIMIT 1
	`;
	return rows.length > 0;
};
