package com.example.cryptotransactionsdemo.mapper;

import com.example.cryptotransactionsdemo.model.Transaction;
import com.example.cryptotransactionsdemo.model.TransactionSummary;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Arg;
import org.apache.ibatis.annotations.ConstructorArgs;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface TransactionMapper {

    // Legacy endpoint for the earlier lesson: unpaged, no date filter.
    @Select("""
        <script>
        SELECT id, wallet_address, asset, amount, direction, created_at
        FROM transactions
        WHERE LOWER(wallet_address) = LOWER(#{walletAddress})
        <if test="asset != null">
            AND UPPER(asset) = UPPER(#{asset})
        </if>
        ORDER BY id
        </script>
        """)
    @ConstructorArgs({
        @Arg(column = "id", javaType = long.class, id = true),
        @Arg(column = "wallet_address", javaType = String.class),
        @Arg(column = "asset", javaType = String.class),
        @Arg(column = "amount", javaType = BigDecimal.class),
        @Arg(column = "direction", javaType = String.class),
        @Arg(column = "created_at", javaType = OffsetDateTime.class)
    })
    List<Transaction> findByWallet(
            @Param("walletAddress") String walletAddress,
            @Param("asset") String asset
    );

    @Select("""
        <script>
        SELECT id, wallet_address, asset, amount, direction, created_at
        FROM transactions
        WHERE LOWER(wallet_address) = LOWER(#{walletAddress})
        <if test="asset != null">
            AND UPPER(asset) = UPPER(#{asset})
        </if>
        <if test="startInclusive != null">
            AND created_at >= #{startInclusive}
        </if>
        <if test="endExclusive != null">
            AND created_at &lt; #{endExclusive}
        </if>
        ORDER BY created_at DESC, id DESC
        LIMIT #{limit} OFFSET #{offset}
        </script>
        """)
    @ConstructorArgs({
        @Arg(column = "id", javaType = long.class, id = true),
        @Arg(column = "wallet_address", javaType = String.class),
        @Arg(column = "asset", javaType = String.class),
        @Arg(column = "amount", javaType = BigDecimal.class),
        @Arg(column = "direction", javaType = String.class),
        @Arg(column = "created_at", javaType = OffsetDateTime.class)
    })
    List<Transaction> findPage(
            @Param("walletAddress") String walletAddress,
            @Param("asset") String asset,
            @Param("startInclusive") OffsetDateTime startInclusive,
            @Param("endExclusive") OffsetDateTime endExclusive,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    @Select("""
        <script>
        SELECT COUNT(*)
        FROM transactions
        WHERE LOWER(wallet_address) = LOWER(#{walletAddress})
        <if test="asset != null">
            AND UPPER(asset) = UPPER(#{asset})
        </if>
        <if test="startInclusive != null">
            AND created_at >= #{startInclusive}
        </if>
        <if test="endExclusive != null">
            AND created_at &lt; #{endExclusive}
        </if>
        </script>
        """)
    long countFiltered(
            @Param("walletAddress") String walletAddress,
            @Param("asset") String asset,
            @Param("startInclusive") OffsetDateTime startInclusive,
            @Param("endExclusive") OffsetDateTime endExclusive
    );

    @Select("""
        <script>
        SELECT asset,
               SUM(CASE WHEN direction = 'IN' THEN amount ELSE 0 END) AS total_in,
               SUM(CASE WHEN direction = 'OUT' THEN amount ELSE 0 END) AS total_out,
               COUNT(*) AS transaction_count
        FROM transactions
        WHERE LOWER(wallet_address) = LOWER(#{walletAddress})
        <if test="asset != null">
            AND UPPER(asset) = UPPER(#{asset})
        </if>
        <if test="startInclusive != null">
            AND created_at >= #{startInclusive}
        </if>
        <if test="endExclusive != null">
            AND created_at &lt; #{endExclusive}
        </if>
        GROUP BY asset
        ORDER BY asset
        </script>
        """)
    @ConstructorArgs({
        @Arg(column = "asset", javaType = String.class),
        @Arg(column = "total_in", javaType = BigDecimal.class),
        @Arg(column = "total_out", javaType = BigDecimal.class),
        @Arg(column = "transaction_count", javaType = long.class)
    })
    List<TransactionSummary> summarizeByWallet(
            @Param("walletAddress") String walletAddress,
            @Param("asset") String asset,
            @Param("startInclusive") OffsetDateTime startInclusive,
            @Param("endExclusive") OffsetDateTime endExclusive
    );
}
