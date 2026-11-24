// Type surface for deploy-marker.mjs's pure core (the scripts/ tree is plain ESM, `allowJs` off).
export function deploymentRequest(input: {
  sha: string;
  environment: string;
  description?: string;
}): Record<string, unknown>;
export function statusRequest(input: {
  state: string;
  url?: string;
  logUrl?: string;
  description?: string;
}): Record<string, unknown>;
export function parseArgs(argv: string[]): {
  environment: string;
  url: string;
  state: string;
  description: string;
};
