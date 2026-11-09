import { defineConfig, devices } from '@playwright/test'

/**
 * Isolated local ports avoid interfering with the developer's 8080/5173
 * processes. The real Spring Boot service queries the local PostgreSQL DB.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5174',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: process.env.CI
        ? 'cd .. && ./mvnw -q -DskipTests package && ' +
          'java -jar target/crypto-transactions-demo-0.0.1-SNAPSHOT.jar --server.port=18080'
        : 'cd .. && mise exec -- ./mvnw -q -DskipTests package && ' +
          'mise exec -- java -jar target/crypto-transactions-demo-0.0.1-SNAPSHOT.jar --server.port=18080',
      url: 'http://127.0.0.1:18080/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: process.env.CI
        ? 'API_PROXY_TARGET=http://127.0.0.1:18080 npm run dev -- --host 127.0.0.1 --port 5174 --strictPort'
        : 'API_PROXY_TARGET=http://127.0.0.1:18080 mise exec -- npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174/',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
