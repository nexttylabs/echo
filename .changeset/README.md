# Changesets

This repository uses Changesets to manage versioning and changelogs.

## Add a changeset

```bash
bun run changeset
```

Follow the prompts and commit the generated file in `.changeset/` with your changes.

## Release flow

On merge to `main`, GitHub Actions will:
1. Run `changeset version`
2. Update `CHANGELOG.md` and `package.json`
3. Create a tag `vX.Y.Z`
4. Publish to npm

See `.github/workflows/release.yml` for details.
