# Web Site Change Detection Repository

## Notes:
- Selenium browser currently does no scrolling. Don't support dynamic pages yet. Need to think more about how these should be done beacuse we cannot be scrolling forever.

### TODO:

- I added error catching for `streamHtmlPageToBucket` and `streamScreenshotPngToBucket` functions to only execute the postgres insert query for the snapshot table if both async functions execute correctly. Look at if this pattern makes sense. I hate it, it looks so ugly. Clean up the error catching or shift it to using async instead of .then to make catching unexepcted errors easier without compromising error handeling.

- Add SQL logic that will insert an archived record to the postgres database. The Archive `snapshot` postgres column

- Add new SQL functions that deal with ingesting and querying down the rows from db;

- Add the REST API to add or remove tasks. Already have a list function. Need logic to remove one if provided. And logic to restart a task too (delete a task and then pull the same one from the db)

- Add A looging middleware now before complexity spirals out of control
