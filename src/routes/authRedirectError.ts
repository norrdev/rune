// Supabase reports failed email links (expired, already used) via the URL hash
// (implicit flow) or the query string (PKCE flow).
export const getAuthRedirectError = (): string | null => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const description = hashParams.get('error_description') || queryParams.get('error_description');
  if (description) return description.replace(/\+/g, ' ');
  if (hashParams.get('error') || queryParams.get('error')) {
    return 'The link is invalid or has expired.';
  }
  return null;
};

// How long to wait for Supabase to exchange the link for a session.
export const AUTH_REDIRECT_TIMEOUT_MS = 10000;
