package com.example.cryptotransactionsdemo.model;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonFormat;

public record TransactionSummary(
        String asset,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal totalIn,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal totalOut,
        long transactionCount
) {
}
