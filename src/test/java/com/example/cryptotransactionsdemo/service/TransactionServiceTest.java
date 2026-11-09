package com.example.cryptotransactionsdemo.service;

import com.example.cryptotransactionsdemo.mapper.TransactionMapper;
import com.example.cryptotransactionsdemo.model.Transaction;
import com.example.cryptotransactionsdemo.model.TransactionSummary;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransactionServiceTest {
    private final TransactionMapper mapper = mock(TransactionMapper.class);
    private final TransactionService service = new TransactionService(mapper);

    @Test
    void keepsLegacyEndpointWorking() {
        var data = List.of(new Transaction(
                1L, "0xabc", "ETH", new BigDecimal("1.25"), "IN",
                OffsetDateTime.parse("2026-11-01T10:00:00Z")));
        when(mapper.findByWallet("0xabc", null)).thenReturn(data);

        assertEquals(data, service.findByWallet("0xabc", null));
        verify(mapper).findByWallet("0xabc", null);
    }

    @Test
    void paginatesUsingLongOffsetAndTotalCount() {
        when(mapper.countFiltered("0xabc", null, null, null)).thenReturn(13L);
        var result = service.findPage("0xabc", null, null, null, 2, 5);

        assertEquals(13, result.totalElements());
        assertEquals(3, result.totalPages());
        assertEquals(2, result.page());
        verify(mapper).findPage("0xabc", null, null, null, 5, 10L);
    }

    @Test
    void returnsEmptyItemsForOutOfRangePage() {
        when(mapper.countFiltered("0xabc", null, null, null)).thenReturn(1L);

        var result = service.findPage("0xabc", null, null, null, 3, 2);
        assertTrue(result.items().isEmpty());
        assertEquals(1, result.totalPages());
    }

    @Test
    void usesUtcInclusiveStartAndExclusiveEnd() {
        var result = service.findPage(
                "0xabc", "eth", LocalDate.parse("2026-11-01"),
                LocalDate.parse("2026-11-03"), 0, 2);
        assertEquals(0, result.totalElements());
        verify(mapper).countFiltered(
                "0xabc", "ETH",
                OffsetDateTime.parse("2026-11-01T00:00:00Z"),
                OffsetDateTime.parse("2026-11-04T00:00:00Z"));
    }

    @Test
    void delegatesSummaryWithFilters() {
        var summary = List.of(new TransactionSummary(
                "ETH", new BigDecimal("1.25"), new BigDecimal("0.75"), 2));
        when(mapper.summarizeByWallet("0xabc", "ETH", null, null)).thenReturn(summary);

        assertEquals(summary, service.summarizeByWallet("0xabc", "eth", null, null));
    }

    @Test
    void rejectsInvalidFiltersAndPageSizes() {
        assertThrows(IllegalArgumentException.class,
                () -> service.findPage(" ", null, null, null, 0, 2));
        assertThrows(IllegalArgumentException.class,
                () -> service.findPage("0xabc", null, null, null, -1, 2));
        assertThrows(IllegalArgumentException.class,
                () -> service.findPage("0xabc", null, null, null, 0, 0));
        assertThrows(IllegalArgumentException.class,
                () -> service.findPage("0xabc", null, null, null, 0, 101));
        assertThrows(IllegalArgumentException.class,
                () -> service.findPage("0xabc", "!!!", null, null, 0, 2));
        assertThrows(IllegalArgumentException.class,
                () -> service.findPage("0xabc", null,
                        LocalDate.parse("2026-11-10"), LocalDate.parse("2026-11-01"), 0, 2));
    }
}
