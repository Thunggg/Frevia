import { Badge } from "@repo/ui/components/shadcn/badge";
import { cn } from "@repo/ui/lib/utils";

/**
 * Returns distinct, eye-catching color classes for each HTTP method.
 * Follows OpenAPI / Swagger standard conventions with full dark mode support.
 */
export function getMethodBadgeClasses(method: string): string {
  const m = (method || "").toUpperCase();
  switch (m) {
    case "GET":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
    case "POST":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "PUT":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "PATCH":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800";
    case "DELETE":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getMethodDotColor(method: string): string {
  const m = (method || "").toUpperCase();
  switch (m) {
    case "GET":
      return "bg-blue-500";
    case "POST":
      return "bg-emerald-500";
    case "PUT":
      return "bg-amber-500";
    case "PATCH":
      return "bg-purple-500";
    case "DELETE":
      return "bg-rose-500";
    default:
      return "bg-muted-foreground";
  }
}

export function HttpMethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  const norm = (method || "").toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono font-semibold tracking-wide uppercase shadow-none border",
        getMethodBadgeClasses(norm),
        className,
      )}
    >
      {norm}
    </Badge>
  );
}

