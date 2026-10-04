"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Dark canvas is the product default (DESIGN.md "Dark Canvas (Default)"), so the
 * provider is pinned to `dark` and never follows the OS. The light canvas stays
 * available as an opt-in class for later phases.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
    >
      {children}
    </NextThemesProvider>
  );
}
