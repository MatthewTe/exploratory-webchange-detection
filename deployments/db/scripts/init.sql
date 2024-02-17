\c postgres;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "comparison" (
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "source_snapshot" uuid UNIQUE,
  "new_snapshot" uuid UNIQUE,
  "unified_diff" text
);

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

-- ALTER TABLE "snapshot" ADD CONSTRAINT "snapshot_parent_website" FOREIGN KEY ("id") REFERENCES "website" ("id");

-- ALTER TABLE "snapshot" ADD FOREIGN KEY ("id") REFERENCES "comparison" ("source_snapshot");

-- ALTER TABLE "snapshot" ADD FOREIGN KEY ("id") REFERENCES "comparison" ("new_snapshot");
