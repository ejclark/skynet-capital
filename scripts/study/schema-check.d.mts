// Type surface for schema-check.mjs (`allowJs` is off).

export function schemaProblems(
  schema: Record<string, unknown>,
  value: unknown,
  path?: string,
): string[];
