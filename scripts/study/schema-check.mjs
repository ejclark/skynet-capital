// A small JSON-schema check (#4943) — the subset the study's role schemas use (type, required,
// properties, additionalProperties: false, items, enum, minItems/maxItems, minimum/maximum). The
// sealed CLI enforces a role's schema itself; this holds a STUB answer to the same bar, so a dry
// run cannot pass on an answer a real call could never have returned. PURE, specced in
// tests/scripts/study-sealed.spec.ts.

const typeOf = (v) =>
  v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v;

function typeOk(want, v) {
  const have = typeOf(v);
  const wants = Array.isArray(want) ? want : [want];
  return wants.some((w) => w === have || (w === "number" && have === "integer"));
}

/**
 * Every way `value` breaks `schema`, each as "<path>: <why>"; [] when it fits.
 * @param {Record<string, any>} schema
 * @param {unknown} value
 */
export function schemaProblems(schema, value, path = "$") {
  const out = [];
  if (schema.type && !typeOk(schema.type, value)) {
    return [`${path}: expected ${schema.type}, got ${typeOf(value)}`];
  }
  if (schema.enum && !schema.enum.some((e) => e === value)) {
    out.push(`${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum)
      out.push(`${path}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum)
      out.push(`${path}: above ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      out.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems)
      out.push(`${path}: more than ${schema.maxItems} items`);
    if (schema.items) {
      value.forEach((v, i) => {
        out.push(...schemaProblems(schema.items, v, `${path}[${i}]`));
      });
    }
  }
  if (typeOf(value) === "object") {
    const props = schema.properties ?? {};
    for (const key of schema.required ?? []) {
      if (!(key in value)) out.push(`${path}: missing ${key}`);
    }
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) out.push(...schemaProblems(props[key], v, `${path}.${key}`));
      else if (schema.additionalProperties === false) out.push(`${path}: unexpected ${key}`);
    }
  }
  return out;
}
