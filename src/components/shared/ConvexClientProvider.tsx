"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "@/lib/convex-client";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
