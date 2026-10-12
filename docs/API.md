# HTTP API

The Express service defaults to port `3000`. Set `PORT` to change the listening port and `BASE_URL` to change the public origin used in generated `shortUrl` values. The API stores links in memory.

Successful responses use an object with a `data` property. Errors use an object with an `error` string.

## Create a short link

`POST /api/links` accepts JSON:

```json
{
  "url": "https://example.com/resources",
  "customCode": "resources"
}
```

`url` must be an absolute HTTP or HTTPS URL. `customCode` is optional. When supplied, it must contain 3–32 letters, numbers, hyphens, or underscores and must not already be in use.

Success status: `201 Created`.

```json
{
  "data": {
    "id": "generated-id",
    "originalUrl": "https://example.com/resources",
    "shortCode": "resources",
    "shortUrl": "http://localhost:3000/resources",
    "clicks": 0,
    "createdAt": "2026-10-12T00:00:00.000Z"
  }
}
```

Possible errors: `400` for invalid input or malformed JSON; `409` when a custom code is already used.

## List links

`GET /api/links` returns `200 OK` with all links in a `data` array. Each link has the fields shown above.

## Read link metadata

`GET /api/links/:code` returns `200 OK` with the matching link in `data`. It returns `404 Not Found` if the code does not exist.

## Redirect

`GET /:code` returns `302 Found` with the link's original URL in the `Location` header. A successful redirect increments `clicks`. An unknown code returns `404 Not Found` with an error envelope.
