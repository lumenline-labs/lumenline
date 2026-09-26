/**
 * Cross-app destinations. All three confirmed real and live: the GitHub repo
 * (github.com/lumenline-labs/lumenline), and apps/site and apps/docs' current real deployments —
 * their Vercel-assigned URLs, not the aspirational lumenline.dev/docs.lumenline.dev custom domains
 * this file pointed at before (those aren't wired up to anything yet). Update here once a custom
 * domain is actually live; nothing that reads LINKS needs to change.
 */
export const LINKS = {
  /** apps/site's own current real deployment. */
  home: "https://lumenline-site.vercel.app/",
  /** apps/docs' own current real deployment. */
  docs: "https://lumenline-docs.vercel.app/",
  /** The public GitHub org/repo — confirmed real and live. */
  github: "https://github.com/lumenline-labs/lumenline",
} as const;
