import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionButtonProps {
  /** Accessible name and idle tooltip. */
  label: string;
  /** Tooltip shown while this action is in flight. */
  pendingLabel: string;
  /** Icon rendered inside the button. */
  icon: ReactNode;
  /** Whether this specific action is currently running. */
  pending: boolean;
  /** Whether the button is disabled (any action in flight). Defaults to false. */
  disabled?: boolean;
  /** Starts the action. */
  onClick: () => void;
  /** Extra Tailwind classes forwarded to the button. */
  className?: string;
}

/**
 * Icon button with a tooltip that swaps to a pending label while in flight.
 */
export default function ActionButton({
  label,
  pendingLabel,
  icon,
  pending,
  disabled = false,
  onClick,
  className,
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={className}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent>{pending ? pendingLabel : label}</TooltipContent>
    </Tooltip>
  );
}
