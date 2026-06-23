# Release process

## Pre-flight

- [ ] All CI jobs green on `main`.
- [ ] No `console.log` / debug artifacts left in `src/`.
- [ ] Gallery + editor demos still build cleanly.

## Cut the release

```bash
# Pick semver bump
npm version patch   # or `minor` / `major`

# This creates a commit + tag `vX.Y.Z` on `main`.
git push --follow-tags
```

The push tag triggers `.github/workflows/release.yml`, which runs
`typecheck + test + build` and then `npm publish --provenance --access public`.

## Post-release

1. Verify install in a sandbox:
   ```bash
   mkdir /tmp/flint-smoke && cd /tmp/flint-smoke
   npm init -y && npm install flint-chart vega-lite
   node -e "console.log(require('flint-chart').assembleVegaLite({data:{values:[]},chart_spec:{chartType:'Bar Chart',encodings:{}}}))"
   ```

## Versioning policy

Following [semver](https://semver.org/):

- **patch:** bug fixes, internal refactors, snapshot tweaks.
- **minor:** new templates, new semantic types, new optional fields on
  public types, new backend (additive only).
- **major:** removed / renamed exports, changed default behavior,
  breaking type changes, peer-dep major bumps that consumers must follow.

## Pre-1.0 policy

While `0.x`, minor bumps may include breaking changes. Note any
breakage in the GitHub release notes with a migration note.
