# Migration baseline

`20261003000000_baseline` captures the current PostgreSQL schema **before**
`Challenge.eventBannerUrl`. It was generated locally with Prisma 6 using
`migrate diff --from-empty --to-schema-datamodel` and a temporary copy of
`prisma/schema.prisma` with only the `eventBannerUrl` field removed.
`20261004000000_add_event_banner_url` then adds the nullable field and copies
existing `punishmentPfpUrl` values into it, retaining PFP values and storage files.

Run commands from the repository root, with connection variables configured for
an explicitly reviewed target database. These are deployment instructions, not
automatic setup steps.

## Fresh, empty database

Review both SQL files, then apply the complete migration history:

```sh
npx prisma migrate deploy --schema prisma/schema.prisma
```

The baseline creates the existing tables, enums, indexes, and foreign keys; the
incremental migration adds the banner column. No baseline resolve is needed.

## Existing database created with `db push`

**Before marking the baseline applied, back up the database and verify its actual
schema matches the baseline SQL** (tables, columns, types, defaults, enums,
indexes, and constraints). The baseline reflects the repository schema, not an
introspection of any deployed database. Review and reconcile any drift first;
`migrate resolve` records migration history without checking or executing the SQL.
This path assumes `eventBannerUrl` does not yet exist. If it already exists or
migration history is present, stop and review a separate reconciliation plan.

Only after schema verification and explicit approval:

```sh
npx prisma migrate resolve --applied 20261003000000_baseline --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
```

Do not execute the baseline SQL against an existing populated database. Resolve
marks it as already applied; deploy then runs the reviewed incremental migration.
Do not use `db push` to add the banner column before deploy: it would bypass the
backfill and conflict with the migration's `ADD COLUMN`.
