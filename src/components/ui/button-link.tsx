import { createLink, type LinkComponent } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonLinkPrimitiveProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof buttonVariants> {}

function ButtonLinkPrimitive({
  className,
  variant = "default",
  size = "default",
  ref,
  ...props
}: ButtonLinkPrimitiveProps & { ref?: React.Ref<HTMLAnchorElement> }) {
  return (
    <a
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

const CreatedButtonLink = createLink(ButtonLinkPrimitive);

/**
 * A `Link` that is styled like a `Button`, for navigating to another route.
 *
 * @remarks
 * Renders a plain `<a>` tag under the hood, unlike `Button`'s Base UI
 * primitive, so it keeps native link semantics (right-click, cmd/ctrl+click,
 * accessibility) that a `<button>`-rendered element can't provide.
 *
 * @example
 * ```tsx
 * <ButtonLink to="/posts/$postId" params={{ postId }} variant="outline">
 *   View Post
 * </ButtonLink>
 * ```
 */
export const ButtonLink: LinkComponent<typeof ButtonLinkPrimitive> = (props) => {
  return <CreatedButtonLink preload="intent" {...props} />;
};
