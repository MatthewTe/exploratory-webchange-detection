# Web Site Change Detection Repository

## Notes:
- Selenium browser currently does no scrolling. Don't support dynamic pages yet. Need to think more about how these should be done beacuse we cannot be scrolling forever.

- Had to disable the fk contraint for the database ingestion into the `snapshots` table. Don't know if its because of the postgres datatypes of [postgres.js](https://github.com/porsager/postgres?tab=readme-ov-file#custom-types) (probably not) or some kind of contraints issue. Currently the snapshots only references the id field in the `websites` table so there isn't any kind of constraints on the data:

```sql
CREATE TABLE "website" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "name" VARCHAR UNIQUE,
  "url" VARCHAR UNIQUE,
  "archive_period" VARCHAR
);
CREATE TABLE "snapshot" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "extracted_dt" TIMESTAMP,
  "static_dir_root" VARCHAR,
  "website" uuid REFERENCES "website" ("id")
);
```
vs 
```sql
CREATE TABLE "website" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "name" VARCHAR UNIQUE,
  "url" VARCHAR UNIQUE,
  "archive_period" VARCHAR
);
CREATE TABLE "snapshot" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "extracted_dt" TIMESTAMP,
  "static_dir_root" VARCHAR,
  "website" uuid REFERENCES "website" ("id")
);

ALTER TABLE "snapshot" ADD CONSTRAINT "snapshot_parent_website" FOREIGN KEY ("id") REFERENCES "website" ("id");
```

### TODO:

- Add a GET request that returns all of the avalible snapshots for a website. 

- Add Error catching for the tasks reset api

- Add A looging middleware now before complexity spirals out of control
