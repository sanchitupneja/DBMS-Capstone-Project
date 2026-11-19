# SQL Reference (syllabus material)

These files are kept **only for reference/comparison** with the NoSQL design.
They are **not used** by the running application:

| File | What it is |
| --- | --- |
| `hostel_allocation_db.sql` | Original hand-written MySQL DDL, sample data and `JOIN`/`GROUP BY` report queries |
| `schema.sql` | Generated MySQL schema |
| `migrations/20261029120000_init/migration.sql` | Original Prisma Migrate SQL migration (MariaDB/MySQL) |

The live app now uses **MongoDB** with Prisma 6 and the schema in
`../prisma/schema.prisma`. Useful contrasts for a DBMS syllabus:

| Concept | SQL version (this folder) | MongoDB version (live) |
| --- | --- | --- |
| Table / document | `CREATE TABLE students (...)` | `model Student` → `students` collection |
| Primary key | `CHAR(36)` UUID string | `ObjectId` mapped from `_id` |
| Foreign key | `FOREIGN KEY ... REFERENCES` | Plain `ObjectId` scalar + Prisma relation |
| Joins | `LEFT JOIN` in report queries | Prisma `include` / `$lookup`-style reads |
| Schema change | `ALTER TABLE` / migrations | `prisma db push` (indexes + collections) |
| Constraints | `UNIQUE`, `CHECK` | Unique indexes via `@unique` / `@@unique` |
