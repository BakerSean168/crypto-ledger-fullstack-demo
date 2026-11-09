package com.example.cryptotransactionsdemo.model;

import java.util.List;

public record TransactionPage(
        List<Transaction> items,
        int page,
        int size,
        long totalElements,
        long totalPages
) {
}
