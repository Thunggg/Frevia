import * as React from "react";
import { cn } from "../lib/utils";

export interface GoogleIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  size?: number | string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  opticalSize?: number;
  strokeWidth?: number | string;
}

export const GoogleIcon = React.forwardRef<HTMLSpanElement, GoogleIconProps>(
  (
    {
      name,
      className,
      size,
      fill = false,
      weight,
      grade = 0,
      opticalSize = 24,
      strokeWidth,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const symbolText = name ?? (typeof children === "string" ? children : "");

    const computedWeight =
      weight ??
      (typeof strokeWidth === "number"
        ? Math.min(Math.max(Math.round(strokeWidth * 200), 100), 700)
        : typeof strokeWidth === "string" && !isNaN(Number(strokeWidth))
          ? Math.min(Math.max(Math.round(Number(strokeWidth) * 200), 100), 700)
          : 400);

    const customVariationSettings = `'FILL' ${fill ? 1 : 0}, 'wght' ${computedWeight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`;

    const customStyle: React.CSSProperties = {
      ...(size !== undefined
        ? {
            fontSize: typeof size === "number" ? `${size}px` : size,
            width: typeof size === "number" ? `${size}px` : size,
            height: typeof size === "number" ? `${size}px` : size,
          }
        : {}),
      fontVariationSettings: customVariationSettings,
      ...style,
    };

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("material-symbols-outlined", className)}
        style={customStyle}
        {...props}
      >
        {symbolText}
      </span>
    );
  }
);

GoogleIcon.displayName = "GoogleIcon";

/**
 * Factory to create dedicated Google Icon components matching Lucide-like signature
 */
export function createGoogleIcon(defaultName: string, displayName?: string) {
  const IconComponent = React.forwardRef<HTMLSpanElement, GoogleIconProps>(
    ({ name, ...props }, ref) => {
      return <GoogleIcon ref={ref} name={name ?? defaultName} {...props} />;
    }
  );

  IconComponent.displayName = displayName ?? defaultName;
  return IconComponent;
}

export type LucideIcon = React.ComponentType<GoogleIconProps>;
export type LucideProps = GoogleIconProps;
