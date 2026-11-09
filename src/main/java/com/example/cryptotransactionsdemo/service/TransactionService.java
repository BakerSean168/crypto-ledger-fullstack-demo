package com.example.cryptotransactionsdemo.service;

import com.example.cryptotransactionsdemo.mapper.TransactionMapper;
import com.example.cryptotransactionsdemo.model.Transaction;
import com.example.cryptotransactionsdemo.model.TransactionPage;
import com.example.cryptotransactionsdemo.model.TransactionSummary;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class TransactionService {

    private final TransactionMapper transactionMapper;

    public TransactionService(TransactionMapper transactionMapper) {
        this.transactionMapper = transactionMapper;
    }

    /** Existing unpaged teaching endpoint; use findPage for real paginated views. */
    public List<Transaction> findByWallet(String walletAddress, String asset) {
        var filter = normalizedFilter(walletAddress, asset, null, null);
        return transactionMapper.findByWallet(filter.wallet(), filter.asset());
    }

    public TransactionPage findPage(
            String walletAddress, String asset,
            LocalDate startDate, LocalDate endDate,
            int page, int size
    ) {
        var filter = normalizedFilter(walletAddress, asset, startDate, endDate);
        if (page < 0) {
            throw new IllegalArgumentException("page 必须大于或等于 0");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("size 必须在 1 到 100 之间");
        }

        long total = transactionMapper.countFiltered(
                filter.wallet(), filter.asset(), filter.start(), filter.end());
        long offset = (long) page * size;
        var items = offset >= total
                ? List.<Transaction>of()
                : transactionMapper.findPage(
                        filter.wallet(), filter.asset(), filter.start(), filter.end(),
                        size, offset);

        long pages = (total + size - 1) / size;
        return new TransactionPage(items, page, size, total, pages);
    }

    public List<TransactionSummary> summarizeByWallet(
            String walletAddress, String asset,
            LocalDate startDate, LocalDate endDate
    ) {
        var filter = normalizedFilter(walletAddress, asset, startDate, endDate);
        return transactionMapper.summarizeByWallet(
                filter.wallet(), filter.asset(), filter.start(), filter.end());
    }

    private static Filter normalizedFilter(
            String walletAddress, String asset,
            LocalDate startDate, LocalDate endDate
    ) {
        if (walletAddress == null || walletAddress.isBlank() || walletAddress.length() > 128) {
            throw new IllegalArgumentException("walletAddress 必须为 1 到 128 个字符");
        }
        String wallet = walletAddress.trim();
        String normalizedAsset = asset == null || asset.isBlank()
                ? null : asset.trim().toUpperCase(Locale.ROOT);
        if (normalizedAsset != null && !normalizedAsset.matches("[A-Z0-9]{2,20}")) {
            throw new IllegalArgumentException("asset 必须为 2 到 20 位的字母或数字");
        }
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("startDate 不能晚于 endDate");
        }
        // Date-only filters are interpreted in UTC. End date is inclusive
        // at the API boundary and exclusive in SQL (the next UTC midnight).
        OffsetDateTime start = startDate == null
                ? null : startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = endDate == null
                ? null : endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        return new Filter(wallet, normalizedAsset, start, end);
    }

    private record Filter(
            String wallet, String asset, OffsetDateTime start, OffsetDateTime end) {
    }
}
