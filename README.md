# Link Forge

Link Forge is a URL shortener with an Express API and a React web interface. The API creates short codes, returns link metadata, and redirects short URLs to their original destinations while counting clicks.

## Requirements

- Node.js 20.19 or newer
- npm

## Install and run

Install backend and frontend dependencies from the repository root:

```sh
npm install --prefix server
npm install --prefix web
```

Run both applications in development:

```sh
npm run dev
```

The Vite development server hosts the web interface and proxies API requests to Express. To run only the API:

```sh
npm start
```

Set `PORT` to change the API port and `BASE_URL` to set the base URL used when generating `shortUrl` values. The service uses in-memory storage; links and click counts reset when the API process restarts.

The Vite development server proxies API and short-link requests to `http://localhost:3000` by default. Set `VITE_API_PROXY` to change that proxy target, or set `VITE_API_BASE_URL` when the browser should call an API origin directly.

## API

Successful API responses use `{ "data": ... }`; errors use `{ "error": ... }`.

### Create a link

`POST /api/links`

```json
{
  "url": "https://example.com/article",
  "customCode": "my-article"
}
```

`customCode` is optional. The response contains a link with `id`, `originalUrl`, `shortCode`, `shortUrl`, `clicks`, and `createdAt` fields.

### List links

`GET /api/links` returns the created links in a `data` array.

### Get link metadata

`GET /api/links/:code` returns the matching link metadata, including its current click count.

### Follow a short link

`GET /:code` redirects to the original URL and increments the link's click count.

## Development and tests

Run the backend's Node test runner with:

```sh
npm test
```

Build the frontend production bundle with:

```sh
npm run build
```

See `docs/` for the API reference and test guidance.

## Project layout

- `server/` — Express API, link store, and backend tests
- `web/` — React application
- `docs/` — API and test documentation
