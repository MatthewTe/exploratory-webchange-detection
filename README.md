# Web Site Change Detection Repository

### TODO:
1) Implement async Selenium functions for pulling down html content
    * Make the logic that extracts the data and scrolls down to bottom of page more robust.
    * pipe the outputs to minio functions to ingest extracted content.
    * Error catching

2) Add minio functions for uploading files to blob storage
    * HTML file
    * snapshot

3) Add new SQL functions that deal with ingesting and querying down the rows from db;

4) Add the REST API to add or remove tasks. Already have a list function. Need logic to remove one if provided.