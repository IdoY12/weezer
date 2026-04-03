/** Read the `csrf` cookie value so we can send it in `x-csrf-token` (double-submit CSRF pattern). */
export function getCsrfTokenFromCookie(): string {
    // No `document` in SSR/tests/Node — avoid touching the DOM when it does not exist.
    if (typeof document === "undefined") return "";
    // Browsers expose all readable cookies as one string: "name1=val1; name2=val2; csrf=TOKEN".
    // There is no getCookie("csrf") API — we must find the `csrf=...` part inside that string ourselves.
    // `.match(regex)` returns either `null` (no match) or an array: [fullMatch, group1, ...].
    // The regex finds `csrf=` at the start or right after `"; "` (standard separator), then captures everything until the next `;` — that captured piece is the token at index `m[1]`.
    const m = document.cookie.match(/(?:^|; )csrf=([^;]*)/);
    // No match → no token yet. If we have a match, turn `%XX` sequences back into real characters (cookies may store values in percent-encoding).
    return m ? decodeURIComponent(m[1]) : "";
}

/** Headers for one-off axios calls (same token source as AuthAware’s request interceptor). */
export function csrfHeaders(): Record<string, string> {
    const t = getCsrfTokenFromCookie();
    return t ? { "x-csrf-token": t } : {};
}
