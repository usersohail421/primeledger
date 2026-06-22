package com.siteledger.bill.controller;

import com.siteledger.bill.dto.request.BillRequest;
import com.siteledger.bill.dto.response.BillResponse;
import com.siteledger.bill.dto.response.ItemSearchResponse;
import com.siteledger.bill.service.BillService;
import com.siteledger.pdf.PdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/projects/{projectId}/bills")
@RequiredArgsConstructor
@Tag(name = "Bills", description = "Bill and expense entry management")
public class BillController {

    private final BillService billService;
    private final PdfService pdfService;

    @PostMapping
    @Operation(summary = "Create a new bill for a project")
    public ResponseEntity<BillResponse> createBill(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody BillRequest request) {
        return ResponseEntity.ok(
                billService.createBill(userDetails.getUsername(), projectId, request));
    }

    @GetMapping
    @Operation(summary = "Get all bills for a project")
    public ResponseEntity<Page<BillResponse>> getBills(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("billDate").descending());
        return ResponseEntity.ok(
                billService.getBillsByProject(
                        userDetails.getUsername(), projectId, from, to, pageable));
    }

    @GetMapping("/{billId}")
    @Operation(summary = "Get a bill by ID")
    public ResponseEntity<BillResponse> getBillById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long billId) {
        return ResponseEntity.ok(
                billService.getBillById(userDetails.getUsername(), projectId, billId));
    }

    @PutMapping("/{billId}")
    @Operation(summary = "Update a bill")
    public ResponseEntity<BillResponse> updateBill(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long billId,
            @Valid @RequestBody BillRequest request) {
        return ResponseEntity.ok(
                billService.updateBill(userDetails.getUsername(), projectId, billId, request));
    }

    @DeleteMapping("/{billId}")
    @Operation(summary = "Permanently delete a bill and log who deleted it")
    public ResponseEntity<Void> deleteBill(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long billId) {
        billService.deleteBill(userDetails.getUsername(), projectId, billId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/items/search")
    @Operation(summary = "Search bill items by keyword across all bills in a project")
    public ResponseEntity<ItemSearchResponse> searchItems(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @RequestParam String keyword) {
        return ResponseEntity.ok(
                billService.searchItems(userDetails.getUsername(), projectId, keyword));
    }

    @GetMapping("/{billId}/pdf")
    @Operation(summary = "Download bill as PDF")
    public ResponseEntity<byte[]> downloadBillPdf(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long billId) {
        byte[] pdf = pdfService.generateBillPdf(
                userDetails.getUsername(), projectId, billId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=bill-" + billId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}