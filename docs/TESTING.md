# Testing

The backend tests use Node's built-in test runner and do not require a separate test framework.

Run the full backend suite from the repository root:

```sh
npm test
```

Or run it from the backend directory:

```sh
cd server
npm test
```

The route tests start the exported Express app on an ephemeral local port and exercise the HTTP contract: creation, listing, metadata lookup, redirects, click counting, input errors, duplicate codes, missing links, and malformed JSON. Store tests cover generated and custom codes, copied link records, and click-count mutation.

The current suite is local and deterministic; it does not require a running API process or network access.
