# Crypto Transactions Demo / LedgerView

A small full-stack practice project: React + TypeScript, Java 25, Spring Boot 4.1,
MyBatis, PostgreSQL 18 and Docker Compose.

**This is a local educational demo. The wallet addresses and transaction timestamps
are synthetic and no live blockchain data is loaded.**

![LedgerView: local crypto transaction ledger demo](docs/ledger-view.png)

## Learning goals

This repository is a study exercise—not a production crypto accounting tool.
It demonstrates Spring MVC routing, service/mapper separation, MyBatis SQL
mapping, precision-safe amounts, UTC date filtering, database pagination,
PostgreSQL integration tests and React browser E2E tests.

简述：这是一个 Java Spring Boot + React/TypeScript 的全栈学习项目，
用于练习交易查询、财务金额精度、日期边界、分页和自动化测试；
不包含真实链上数据，也不提供实际财税服务。

## Development

Prerequisites: WSL/Linux, Docker Compose, mise, JDK 25 and Node.js 24
(the versions are pinned in mise.toml).

Start local PostgreSQL once:

    cd ~/projects/crypto-transactions-demo
    docker compose up -d db

Start Spring Boot in terminal A:

    cd ~/projects/crypto-transactions-demo
    mise exec -- ./mvnw spring-boot:run

Start React in terminal B:

    cd ~/projects/crypto-transactions-demo/frontend
    mise exec -- npm ci
    mise exec -- npm run dev

Open http://localhost:5173.

The frontend Vite server proxies /api calls to http://127.0.0.1:8080.
The PostgreSQL container is bound to 127.0.0.1:55432, not public interfaces.

Restart the backend after changing Java files; frontend code hot-reloads in Vite.

## Existing database migration

Docker's /docker-entrypoint-initdb.d scripts only run when the database volume is
first created. The file db/init/002_created_at.sql has **already been applied** to
the existing local volume on 2026-11-09. It adds created_at and an index without
deleting or recreating data.

For another existing demo volume, apply it manually once (the script is idempotent):

    docker compose exec -T db psql -X -v ON_ERROR_STOP=1 \
      -U demo -d crypto_demo < db/init/002_created_at.sql

Fresh volumes execute both 001_transactions.sql and 002_created_at.sql automatically.

Note: timestamps backfilled for old records are fabricated teaching values.
A real transaction history must obtain transaction times from an authoritative source.

## Demo API

The old GET /api/transactions is deliberately kept for the previous lessons.
The React page uses the new paginated endpoint instead:

    GET /api/transactions/page?walletAddress=0xabc&page=0&size=2
    GET /api/transactions/page?walletAddress=0xabc&asset=ETH&startDate=2026-11-01&endDate=2026-11-03
    GET /api/transactions/summary?walletAddress=0xabc&startDate=2026-11-01&endDate=2026-11-03

Dates are **UTC**, using an inclusive startDate and inclusive endDate at the
API level. SQL uses [startDate 00:00 UTC, endDate + 1 day 00:00 UTC).
Missing dates mean an unbounded range. Pages are 0-based; default size=2,
valid size 1..100.

The page JSON has:

    { "items": [...], "page": 0, "size": 2,
      "totalElements": 3, "totalPages": 2 }

Records are ordered by created_at DESC, then id DESC.
The summary is computed across **all matching records**, not just the selected page.

Money uses NUMERIC(30,18) in PostgreSQL, BigDecimal in Java, and decimal
**strings** in API JSON to avoid JavaScript floating-point precision issues.

## Tests

Start PostgreSQL before running the backend tests; the MyBatis integration tests
connect to the local demo database. They insert their own isolated fixture rows
in an automatic rollback transaction, leaving existing data unchanged.

Backend:

    mise exec -- ./mvnw test

Frontend type checking, static checks and unit tests:

    cd frontend
    mise exec -- npm run build
    mise exec -- npm run lint
    mise exec -- npm run test

Browser E2E tests (uses real Chromium, PostgreSQL and dedicated ports
18080 for Spring Boot and 5174 for Vite; leaves your 8080/5173 servers alone):

    cd frontend
    mise exec -- npx playwright install chromium --only-shell
    mise exec -- npm run test:e2e

E2E tests rely on the four demo fixture rows from 001_transactions.sql.
When using an existing volume created before row 4 was added, insert the
extra demo row manually, if necessary. All E2E tests run against the local
demo database and are read-only.

GitHub Actions runs the Maven, React and Chromium checks automatically on pushes to main and pull requests (see .github/workflows/ci.yml). The workflow needs a GitHub remote to run; nothing is published or deployed by this project.

To stop the database without deleting its data:

    docker compose down

Do not use docker compose down -v unless you deliberately want to delete
the local database volume.

## Structure

    frontend/src/App.tsx -> frontend/src/lib/api.ts
      -> Vite /api proxy
      -> TransactionController
      -> TransactionService
      -> TransactionMapper (MyBatis)
      -> PostgreSQL

## Limitations

This is not production-grade accounting software. It does not include
authentication or wallet authorization, real blockchain ingestion, transaction
finality/reorg handling, FX rates, gas-fee accounting, or complete audit trails.
OFFSET pagination and separate COUNT / SELECT queries can show inconsistent results
under concurrent writes; larger systems may need keyset pagination or a snapshot.
