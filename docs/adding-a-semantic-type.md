# Adding a semantic type

Semantic types are the **only** thing LLMs (and humans) tag fields with.
Every visual decision in flint-chart traces back to one.

## 1. Decide what's intrinsic

Before adding a type, ask: *does this carry information no other type
already does?* Avoid synonyms (`Money` vs `Currency` vs `Price`). Pick one,
document it, alias the rest.

Properties a semantic type can carry:

| Property | Example for `Price` |
|---|---|
| `visCategory` | `'measure'` |
| `defaultFormat` | `'$,.0f'` |
| `zero` | `'include'` (numeric axes start at 0) |
| `scaleDirection` | `'normal'` |
| `colorScheme` | sequential |
| `aggregationDefault` | `'sum'` |
| `intrinsicDomain` | unset (data-driven) |

## 2. Register

Edit [`src/core/semantic-types.ts`](../src/core/semantic-types.ts):

```ts
'StockReturn': {
  visCategory: 'measure',
  defaultFormat: '+.1%',
  zero: 'exclude',           // returns center around 0; include is misleading
  colorScheme: 'diverging',  // negative ↔ positive
  aggregationDefault: 'average',
},
```

## 3. Update the table in the README

Find the semantic-types table and add a row. Keep the family taxonomy
balanced — if a new family emerges, it gets its own row group.

## 4. Test it

Add or update a test case in `src/test-data/semantic-tests.ts` that uses
the new type, and verify in the gallery that:

- formatting follows `defaultFormat`
- the axis behaves per `zero` and `scaleDirection`
- the color scheme is appropriate when the field is on `color`

## 5. Document migration if applicable

If you've renamed or merged a type, add a one-line note to
`CHANGELOG.md` under "Changed" so downstream agents can adapt.
