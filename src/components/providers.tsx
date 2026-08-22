import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Composes the app's context providers in one place.
 *
 * @param children - The app content to wrap.
 */
function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

export { Providers };
