package com.siteledger.bill.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class BillRequest {

    private LocalDate billDate;

    private LocalDate billPeriodStart;

    private LocalDate billPeriodEnd;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<BillItemRequest> items;

    public boolean isBillPeriodValid() {
        if (billPeriodStart == null || billPeriodEnd == null) return true;
        return billPeriodStart.isBefore(billPeriodEnd);
    }
}