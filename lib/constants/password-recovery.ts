export const PASSWORD_RECOVERY_INTENT_KEY = "totl:password_recovery_intent_ts";
export const PASSWORD_RECOVERY_QUERY_PARAM = "recovery";

// Keep narrow and short-lived so signed-in auth-route exceptions do not linger.
export const PASSWORD_RECOVERY_INTENT_TTL_MS = 15 * 60 * 1000;
