package com.example.cryptotransactionsdemo.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record Transaction(
        long id,
        String walletAddress,
        String asset,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal amount,
        String direction,
        OffsetDateTime createdAt
) {
}
