package com.siteledger.bill.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {
    private Long id;
    private String billNumber;
    private LocalDate billDate;
    private LocalDate billPeriodStart;
    private LocalDate billPeriodEnd;
    private BigDecimal totalAmount;
    private Long projectId;
    private String projectName;
    private List<BillItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}