package com.siteledger.excel.controller;

import com.siteledger.excel.service.ExcelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Excel Export", description = "Export project expenses to Excel")
public class ExcelController {

    private final ExcelService excelService;

    @GetMapping("/api/projects/{projectId}/export/excel")
    @Operation(summary = "Export all bills of a project to Excel")
    public ResponseEntity<byte[]> exportProjectToExcel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {

        byte[] excel = excelService.generateProjectExcel(
                userDetails.getUsername(), projectId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=project-" + projectId + "-expenses.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}