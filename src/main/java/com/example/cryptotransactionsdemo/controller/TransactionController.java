package com.example.cryptotransactionsdemo.controller;

import com.example.cryptotransactionsdemo.model.Transaction;
import com.example.cryptotransactionsdemo.model.TransactionPage;
import com.example.cryptotransactionsdemo.model.TransactionSummary;
import com.example.cryptotransactionsdemo.service.TransactionService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /** Retained for compatibility with the first MyBatis lesson. */
    @GetMapping
    public List<Transaction> list(
            @RequestParam String walletAddress,
            @RequestParam(required = false) String asset
    ) {
        return transactionService.findByWallet(walletAddress, asset);
    }

    @GetMapping("/page")
    public TransactionPage page(
            @RequestParam String walletAddress,
            @RequestParam(required = false) String asset,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2") int size
    ) {
        return transactionService.findPage(walletAddress, asset, startDate, endDate, page, size);
    }

    @GetMapping("/summary")
    public List<TransactionSummary> summary(
            @RequestParam String walletAddress,
            @RequestParam(required = false) String asset,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return transactionService.summarizeByWallet(walletAddress, asset, startDate, endDate);
    }
}
