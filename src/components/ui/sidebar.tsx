import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { ButtonLink } from "@/components/ui/button-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SidebarItem extends LinkProps {
  icon: LucideIcon;
  title: string;
}

interface SidebarProps extends ComponentProps<"nav"> {
  items: SidebarItem[];
  appIcon: LucideIcon;
}

/**
 * A full-height, icon-only navigation rail that sits alongside page content.
 *
 * @param items - Icons to render, each paired with a `title` shown as a tooltip on hover.
 *
 * @remarks
 * Requires the app to be wrapped in `TooltipProvider` (see `@/components/ui/tooltip`),
 * which is already set up in `__root.tsx`. Render it as a flex sibling of the page
 * content (e.g. `<div className="flex min-h-screen">`) so the two sit side by side.
 *
 * @example
 * ```tsx
 * <div className="flex min-h-screen">
 *   <Sidebar appIcon={Blocks} items={[{ icon: Home, title: "Home", to: "/" }]} />
 *   <main className="flex-1">...</main>
 * </div>
 * ```
 */
function Sidebar({ items, appIcon: AppIcon, className, ...props }: SidebarProps) {
  return (
    <nav
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar p-2",
        className,
      )}
      {...props}
    >
      <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <AppIcon className="size-5" />
      </div>
      {items.map(({ icon: Icon, title, ...linkProps }) => (
        <Tooltip key={title}>
          <TooltipTrigger
            render={
              <ButtonLink
                {...linkProps}
                aria-label={title}
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground [&_svg]:size-5"
              >
                <Icon />
              </ButtonLink>
            }
          />
          <TooltipContent side="right">{title}</TooltipContent>
        </Tooltip>
      ))}
    </nav>
  );
}

export { Sidebar };
