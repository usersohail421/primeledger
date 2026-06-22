package com.siteledger.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeekComparisonResponse {
    private BigDecimal thisWeekSpend;
    private BigDecimal lastWeekSpend;
    private Double changePercent;
    private String trend;
}