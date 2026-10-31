import { Blocks, LayoutDashboard } from "lucide-react";

import type { SidebarItem } from "@/components/ui/sidebar";

/**
 * The app name, used for the page title and meta tags.
 */
export const APP_NAME = "Deploy";

/**
 * The app icon shown at the top of the sidebar.
 */
export const APP_ICON = Blocks;

/**
 * The items shown in the sidebar, each with an icon and a title.
 */
export const SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, title: "Dashboard", to: "/", activeOptions: { exact: true } },
];
