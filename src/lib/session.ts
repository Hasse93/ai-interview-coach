import { auth } from "./auth";

export type CurrentUser = { id: string; email: string; name: string | null };

/**
 * Returns the signed-in user, or null. Wrapped in try/catch so pages render
 * fine even when auth isn't configured (e.g. AUTH_SECRET unset in demo mode).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await auth();
    const u = session?.user as { id?: string; email?: string | null; name?: string | null } | undefined;
    if (!u?.id || !u.email) return null;
    return { id: u.id, email: u.email, name: u.name ?? null };
  } catch {
    return null;
  }
}
