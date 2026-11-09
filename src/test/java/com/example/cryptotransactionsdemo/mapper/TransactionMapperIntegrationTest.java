package com.example.cryptotransactionsdemo.mapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional // Fixture rows are rolled back, leaving the local demo DB unchanged.
class TransactionMapperIntegrationTest {

    @Autowired
    TransactionMapper mapper;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void insertIsolatedFixtures() {
        jdbc.update("""
            INSERT INTO transactions (id, wallet_address, asset, amount, direction, created_at)
            VALUES
              (910001, '0xintegrationtest', 'ETH', 1.25, 'IN', '2026-11-01 10:00:00+00'),
              (910002, '0xintegrationtest', 'ETH', 0.75, 'OUT', '2026-11-02 12:00:00+00'),
              (910003, '0xintegrationtest', 'USDT', 30.50, 'IN', '2026-11-03 09:00:00+00')
            """);
    }

    @Test
    void legacyEndpointStillAcceptsMissingAssetFilter() {
        var all = mapper.findByWallet("0xintegrationtest", null);
        assertEquals(3, all.size());
        var ethOnly = mapper.findByWallet("0xintegrationtest", "eth");
        assertEquals(2, ethOnly.size());
    }

    @Test
    void paginationOrdersByTimeAndCountsAllFilteredRows() {
        var page = mapper.findPage("0xintegrationtest", null, null, null, 2, 0);
        assertEquals(2, page.size());
        assertEquals(910003L, page.get(0).id());
        assertEquals(910002L, page.get(1).id());
        assertEquals(3, mapper.countFiltered("0xintegrationtest", null, null, null));

        var next = mapper.findPage("0xintegrationtest", null, null, null, 2, 2);
        assertEquals(1, next.size());
        assertEquals(910001L, next.get(0).id());
    }

    @Test
    void dateFiltersUseStartInclusiveAndEndExclusive() {
        var start = OffsetDateTime.parse("2026-11-02T00:00:00Z");
        var end = OffsetDateTime.parse("2026-11-03T00:00:00Z");

        var page = mapper.findPage("0xintegrationtest", null, start, end, 10, 0);
        assertEquals(1, page.size());
        assertEquals(910002L, page.get(0).id());
        assertEquals(1, mapper.countFiltered("0xintegrationtest", null, start, end));
    }

    @Test
    void summaryUsesEntireFilteredSetNotCurrentPage() {
        var summary = mapper.summarizeByWallet("0xintegrationtest", "ETH", null, null);
        assertEquals(1, summary.size());
        assertEquals("ETH", summary.get(0).asset());
        assertEquals(0, new BigDecimal("1.25").compareTo(summary.get(0).totalIn()));
        assertEquals(0, new BigDecimal("0.75").compareTo(summary.get(0).totalOut()));
        assertEquals(2, summary.get(0).transactionCount());
    }
}
