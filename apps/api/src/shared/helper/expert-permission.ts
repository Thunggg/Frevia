// Expert has one business capability; profile and session routes support onboarding.
export function expertHasPermission(method: string, path: string): boolean {
  const routes: Record<string, RegExp[]> = {
    GET: [
      /^\/api\/auth\/me$/,
      /^\/api\/expert-profile\/me$/,
      /^\/api\/profile-revisions\/me$/,
      /^\/api\/expert\/disputes(?:\/\d+)?$/,
    ],
    PUT: [/^\/api\/expert-profile\/me$/],
    POST: [
      /^\/api\/auth\/logout$/,
      /^\/api\/expert\/disputes\/\d+\/(?:decision|final-decision)$/,
    ],
  };
  return (
    routes[method.toUpperCase()]?.some((route) => route.test(path)) ?? false
  );
}
