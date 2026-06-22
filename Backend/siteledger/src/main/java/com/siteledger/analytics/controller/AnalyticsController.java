package com.siteledger.analytics.controller;

import com.siteledger.analytics.dto.response.ProjectSummaryResponse;
import com.siteledger.analytics.dto.response.TopItemResponse;
import com.siteledger.analytics.dto.response.WeekComparisonResponse;
import com.siteledger.analytics.dto.response.WeeklySpendResponse;
import com.siteledger.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Project expense analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @Operation(summary = "Get project expense summary")
    public ResponseEntity<ProjectSummaryResponse> getSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(
                analyticsService.getProjectSummary(userDetails.getUsername(), projectId));
    }

    @GetMapping("/weekly")
    @Operation(summary = "Get weekly spend for last 12 weeks")
    public ResponseEntity<List<WeeklySpendResponse>> getWeeklySpend(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(
                analyticsService.getWeeklySpend(userDetails.getUsername(), projectId));
    }

    @GetMapping("/week-comparison")
    @Operation(summary = "Get this week vs last week spend comparison")
    public ResponseEntity<WeekComparisonResponse> getWeekComparison(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(
                analyticsService.getWeekComparison(userDetails.getUsername(), projectId));
    }

    @GetMapping("/top-items")
    @Operation(summary = "Get top 10 items by total amount spent")
    public ResponseEntity<List<TopItemResponse>> getTopItems(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(
                analyticsService.getTopItems(userDetails.getUsername(), projectId));
    }
}