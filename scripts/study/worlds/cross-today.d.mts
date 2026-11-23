// Type surface for cross-today.mjs (`allowJs` is off).

interface Surface {
  id: string;
  label: string;
  viewer: string;
  route?: string;
  struck?: string;
  act?: unknown[];
  expect: unknown[];
}

declare const world: {
  name: string;
  input: string;
  viewers: Record<string, string>;
  chat: boolean;
  reads: (viewer: string) => string[];
  fixtures: unknown;
  surfaces: Surface[];
  oneTap: Surface[];
  artifacts: { route: string; sees: string; why: string }[];
};
export default world;
