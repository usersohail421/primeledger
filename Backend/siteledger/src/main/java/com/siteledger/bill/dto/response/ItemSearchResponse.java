package com.siteledger.bill.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemSearchResponse {

    private String keyword;
    private List<ItemSearchResult> items;
    private BigDecimal totalAmount;
    private Integer itemCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemSearchResult {
        private Long id;
        private String itemName;
        private LocalDate expenseDate;
        private BigDecimal amount;
        private String billNumber;
        private LocalDate billDate;
    }
}