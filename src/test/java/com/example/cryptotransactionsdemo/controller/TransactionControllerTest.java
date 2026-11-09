package com.example.cryptotransactionsdemo.controller;

import com.example.cryptotransactionsdemo.model.Transaction;
import com.example.cryptotransactionsdemo.model.TransactionPage;
import com.example.cryptotransactionsdemo.model.TransactionSummary;
import com.example.cryptotransactionsdemo.service.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TransactionControllerTest {

    private final TransactionService service = mock(TransactionService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new TransactionController(service))
                .setControllerAdvice(new ApiErrorHandler())
                .build();
    }

    @Test
    void pageBindsQueryParametersAndReturnsPageMetadata() throws Exception {
        var tx = new Transaction(
                4L, "0xabc", "ETH", new BigDecimal("0.75"), "OUT",
                OffsetDateTime.parse("2026-11-06T17:45:00Z"));
        var payload = new TransactionPage(List.of(tx), 1, 2, 3L, 2L);
        when(service.findPage("0xabc", "ETH",
                LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-06"), 1, 2))
                .thenReturn(payload);

        mvc.perform(get("/api/transactions/page")
                .param("walletAddress", "0xabc")
                .param("asset", "ETH")
                .param("startDate", "2026-11-01")
                .param("endDate", "2026-11-06")
                .param("page", "1")
                .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.items[0].id").value(4))
                .andExpect(jsonPath("$.items[0].amount").value("0.75"));

        verify(service).findPage("0xabc", "ETH",
                LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-06"), 1, 2);
    }

    @Test
    void pageUsesExpectedDefaults() throws Exception {
        when(service.findPage("0xabc", null, null, null, 0, 2))
                .thenReturn(new TransactionPage(List.of(), 0, 2, 0L, 0L));

        mvc.perform(get("/api/transactions/page").param("walletAddress", "0xabc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.items").isArray());

        verify(service).findPage("0xabc", null, null, null, 0, 2);
    }

    @Test
    void summaryBindsDateAndAssetFilters() throws Exception {
        var summary = new TransactionSummary(
                "ETH", new BigDecimal("1.25"), new BigDecimal("0.75"), 2L);
        when(service.summarizeByWallet("0xabc", "ETH",
                LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-07")))
                .thenReturn(List.of(summary));

        mvc.perform(get("/api/transactions/summary")
                .param("walletAddress", "0xabc")
                .param("asset", "ETH")
                .param("startDate", "2026-11-01")
                .param("endDate", "2026-11-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].asset").value("ETH"))
                .andExpect(jsonPath("$[0].totalIn").value("1.25"))
                .andExpect(jsonPath("$[0].totalOut").value("0.75"));

        verify(service).summarizeByWallet("0xabc", "ETH",
                LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-07"));
    }

    @Test
    void missingRequiredWalletReturnsBadRequest() throws Exception {
        mvc.perform(get("/api/transactions/page"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_PARAMETER"));
    }

    @Test
    void invalidDateFormatReturnsBadRequest() throws Exception {
        mvc.perform(get("/api/transactions/page")
                .param("walletAddress", "0xabc")
                .param("startDate", "11/01/2026"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_PARAMETER"));
    }

    @Test
    void invalidPageSizeHasHumanReadableError() throws Exception {
        when(service.findPage(eq("0xabc"), eq(null), eq(null), eq(null), eq(0), eq(101)))
                .thenThrow(new IllegalArgumentException("size 必须在 1 到 100 之间"));

        mvc.perform(get("/api/transactions/page")
                .param("walletAddress", "0xabc").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_ARGUMENT"))
                .andExpect(jsonPath("$.message").value("size 必须在 1 到 100 之间"));
    }

    @Test
    void legacyEndpointStillDelegatesToService() throws Exception {
        when(service.findByWallet("0xabc", null)).thenReturn(List.of());
        mvc.perform(get("/api/transactions").param("walletAddress", "0xabc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        verify(service).findByWallet("0xabc", null);
    }
}
