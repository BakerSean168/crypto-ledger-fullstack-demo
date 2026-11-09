# LedgerView Frontend

React + TypeScript UI for the Crypto Transactions Demo.

See [the root README](../README.md) for complete instructions, including the
PostgreSQL and Spring Boot services and browser end-to-end tests.

From this directory:

    mise exec -- npm ci
    mise exec -- npm run dev

Use http://localhost:5173, with Vite proxying /api to Spring Boot on port 8080.

Quality checks:

    mise exec -- npm run build
    mise exec -- npm run lint
    mise exec -- npm run test
    mise exec -- npm run test:e2e

The Playwright suite uses dedicated ports 18080/5174, starts a separate
Spring Boot instance, and queries the local demo PostgreSQL database.
