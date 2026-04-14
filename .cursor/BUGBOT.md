# CKEditor5 Math — Repo-Specific BugBot Rules

> Org-wide rules are enforced via Cursor Team Rules.

## CKEditor 5 Plugin

- This is a CKEditor 5 plugin for math/equation rendering. It follows the CKEditor 5 plugin architecture with `src/` for source, `theme/` for styles, and `lang/` for translations.
- TypeScript with multiple tsconfig files (dist, release, test). Ensure the correct config is used for each build target.
- Changes are documented in `CHANGELOG.md`. Plugin metadata is in `ckeditor5-metadata.json`.

## Testing

- Tests are in `tests/` using CKEditor's testing infrastructure. Run tests before merging to validate editor integration.
