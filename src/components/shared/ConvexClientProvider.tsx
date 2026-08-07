"use client";

// ConvexAuthNextjsProvider (from "@convex-dev/auth/nextjs") renders
// ConvexProviderWithAuth, which is what useConvexAuth() requires.
//
// This pairs with ConvexAuthNextjsServerProvider in layout.tsx:
//   Server: ConvexAuthNextjsServerProvider  → reads token from cookie
//   Client: ConvexAuthNextjsProvider        → renders ConvexProviderWithAuth with that token
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}

