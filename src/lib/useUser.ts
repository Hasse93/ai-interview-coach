"use client";

import { useEffect, useState } from "react";

export type ClientUser = { id: string; email: string; name: string | null } | null;

/** Fetches the current user from /api/me. `loading` is true until resolved. */
export function useUser() {
  const [user, setUser] = useState<ClientUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => active && setUser(d.user ?? null))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
