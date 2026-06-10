// Minimal structural JSON-schema checker for Supersonic Studio.
//
// Supports exactly the keywords data/site-intake.schema.json uses:
//   type, properties, required, additionalProperties (false), items, enum.
// Annotation keywords ($schema, $id, title, description, format) are ignored.
//
// This is NOT a general JSON Schema validator. It exists so the Studio
// interview can fail closed (refuse to write data/site-intake.json) when the
// object it built drifts from the schema. The Studio self-test asserts it
// flags unknown keys, wrong types, and missing required fields, and that it
// passes data/site-intake.example.json.
//
// Pure: no filesystem, no globals. Returns an array of issue strings with
// JSON paths ("$.client.name: ..."); empty array means valid.

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value, schemaType) {
  const actual = typeOf(value);
  if (schemaType === 'integer') {
    return actual === 'number' && Number.isInteger(value);
  }
  return actual === schemaType;
}

// Data keys that are documentation conventions, not schema-modeled properties.
// Repo data files carry a root-level "$schema" pointer (see
// data/site-intake.json); it must not trip additionalProperties:false.
function isAnnotationKey(key, isRoot) {
  return isRoot && key.startsWith('$');
}

function check(value, schema, jsonPath, issues, isRoot) {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  if (schema.enum !== undefined) {
    if (!Array.isArray(schema.enum) || !schema.enum.some((candidate) => candidate === value)) {
      issues.push(`${jsonPath}: value ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
      return;
    }
  }

  if (typeof schema.type === 'string' && !matchesType(value, schema.type)) {
    issues.push(`${jsonPath}: expected ${schema.type}, got ${typeOf(value)}`);
    return; // children are meaningless when the container type is wrong
  }

  if (schema.type === 'object' || schema.properties || schema.required) {
    if (typeOf(value) !== 'object') {
      return; // already reported above when type was declared
    }
    const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties : {};

    for (const requiredKey of Array.isArray(schema.required) ? schema.required : []) {
      if (value[requiredKey] === undefined) {
        issues.push(`${jsonPath}: missing required property "${requiredKey}"`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties) && !isAnnotationKey(key, isRoot)) {
          issues.push(`${jsonPath}: unknown property "${key}" (additionalProperties is false)`);
        }
      }
    }

    for (const [key, childSchema] of Object.entries(properties)) {
      if (value[key] !== undefined) {
        check(value[key], childSchema, `${jsonPath}.${key}`, issues, false);
      }
    }
  }

  if ((schema.type === 'array' || schema.items) && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      check(item, schema.items, `${jsonPath}[${index}]`, issues, false);
    });
  }
}

// Validates `data` against `schema`. Returns issue strings; [] means valid.
export function checkAgainstSchema(data, schema) {
  const issues = [];
  check(data, schema, '$', issues, true);
  return issues;
}
