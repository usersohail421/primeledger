package com.siteledger.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitConfig {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> pdfBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> excelBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    public Bucket getLoginBucket(String key) {
        return loginBuckets.computeIfAbsent(key, k -> createBucket(5, Duration.ofMinutes(1)));
    }

    public Bucket getRegisterBucket(String key) {
        return registerBuckets.computeIfAbsent(key, k -> createBucket(3, Duration.ofMinutes(1)));
    }

    public Bucket getPdfBucket(String key) {
        return pdfBuckets.computeIfAbsent(key, k -> createBucket(10, Duration.ofMinutes(1)));
    }

    public Bucket getExcelBucket(String key) {
        return excelBuckets.computeIfAbsent(key, k -> createBucket(5, Duration.ofMinutes(1)));
    }

    public Bucket getGeneralBucket(String key) {
        return generalBuckets.computeIfAbsent(key, k -> createBucket(60, Duration.ofMinutes(1)));
    }

    private Bucket createBucket(int capacity, Duration duration) {
        Refill refill = Refill.greedy(capacity, duration);
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}