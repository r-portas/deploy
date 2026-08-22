import { Outlet } from "@tanstack/react-router";

import { Sidebar } from "@/components/ui/sidebar";
import { APP_ICON, SIDEBAR_ITEMS } from "@/lib/app-config";

/**
 * The app shell, a sidebar alongside the routed page content.
 */
function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar appIcon={APP_ICON} items={SIDEBAR_ITEMS} />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export { AppLayout };
