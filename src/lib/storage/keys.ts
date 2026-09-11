// Section 3: the LocalStorage namespace and keys, kept in one place rather
// than scattered string literals through the codebase.

export const STORAGE_NAMESPACE = "abeleDrumsCoach";
export const STORAGE_KEY = `${STORAGE_NAMESPACE}:data`;

/** Older keys this app (or its previous incarnation) has used, checked once at load time for a soft migration. */
export const LEGACY_STORAGE_KEYS = ["gospel-drum-coach:db:v1"];
