package com.siteledger.analytics.service;

import com.siteledger.analytics.dto.response.ProjectSummaryResponse;
import com.siteledger.analytics.dto.response.TopItemResponse;
import com.siteledger.analytics.dto.response.WeekComparisonResponse;
import com.siteledger.analytics.dto.response.WeeklySpendResponse;
import com.siteledger.exception.ApiException;
import com.siteledger.auth.model.User;
import com.siteledger.analytics.repository.AnalyticsRepository;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.project.repository.ProjectRepository;
import com.siteledger.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final BillRepository billRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter WEEK_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM");

    public ProjectSummaryResponse getProjectSummary(String email, Long projectId) {
        validateOwnership(email, projectId);

        BigDecimal totalSpent = analyticsRepository.getTotalSpentByProject(projectId);
        Long totalBills = billRepository.countByProjectId(projectId);
        Long billsThisMonth = analyticsRepository.getBillsRaisedThisMonth(projectId);

        LocalDate thisWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate thisWeekEnd = LocalDate.now().with(DayOfWeek.SUNDAY);
        LocalDate lastWeekStart = thisWeekStart.minusWeeks(1);
        LocalDate lastWeekEnd = thisWeekEnd.minusWeeks(1);

        BigDecimal thisWeekSpend = analyticsRepository.getSpendBetweenDates(
                projectId, thisWeekStart, thisWeekEnd);
        BigDecimal lastWeekSpend = analyticsRepository.getSpendBetweenDates(
                projectId, lastWeekStart, lastWeekEnd);

        Double changePercent = calculateChangePercent(thisWeekSpend, lastWeekSpend);

        return ProjectSummaryResponse.builder()
                .totalAmountSpent(totalSpent)
                .totalBillCount(totalBills)
                .billsRaisedThisMonth(billsThisMonth)
                .thisWeekSpend(thisWeekSpend)
                .lastWeekSpend(lastWeekSpend)
                .weekOnWeekChangePercent(changePercent)
                .build();
    }

    public List<WeeklySpendResponse> getWeeklySpend(String email, Long projectId) {
        validateOwnership(email, projectId);

        LocalDate from = LocalDate.now().minusWeeks(12);
        List<Object[]> raw = analyticsRepository.getWeeklySpendRaw(projectId, from);

        Map<String, BigDecimal> weeklyMap = new LinkedHashMap<>();

        for (Object[] row : raw) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal amount = (BigDecimal) row[1];

            LocalDate weekStart = date.with(DayOfWeek.MONDAY);
            LocalDate weekEnd = date.with(DayOfWeek.SUNDAY);
            String weekLabel = weekStart.format(WEEK_FORMATTER)
                    + " - " + weekEnd.format(WEEK_FORMATTER);

            weeklyMap.merge(weekLabel, amount, BigDecimal::add);
        }

        List<WeeklySpendResponse> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : weeklyMap.entrySet()) {
            result.add(WeeklySpendResponse.builder()
                    .weekLabel(entry.getKey())
                    .totalAmount(entry.getValue())
                    .build());
        }

        return result;
    }

    public WeekComparisonResponse getWeekComparison(String email, Long projectId) {
        validateOwnership(email, projectId);

        LocalDate thisWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate thisWeekEnd = LocalDate.now().with(DayOfWeek.SUNDAY);
        LocalDate lastWeekStart = thisWeekStart.minusWeeks(1);
        LocalDate lastWeekEnd = thisWeekEnd.minusWeeks(1);

        BigDecimal thisWeek = analyticsRepository.getSpendBetweenDates(
                projectId, thisWeekStart, thisWeekEnd);
        BigDecimal lastWeek = analyticsRepository.getSpendBetweenDates(
                projectId, lastWeekStart, lastWeekEnd);

        Double changePercent = calculateChangePercent(thisWeek, lastWeek);

        String trend;
        if (changePercent == null) trend = "NEUTRAL";
        else if (changePercent > 0) trend = "UP";
        else if (changePercent < 0) trend = "DOWN";
        else trend = "NEUTRAL";

        return WeekComparisonResponse.builder()
                .thisWeekSpend(thisWeek)
                .lastWeekSpend(lastWeek)
                .changePercent(changePercent)
                .trend(trend)
                .build();
    }

    public List<TopItemResponse> getTopItems(String email, Long projectId) {
        validateOwnership(email, projectId);

        List<Object[]> raw = analyticsRepository.getTopItemsRaw(projectId);
        List<TopItemResponse> result = new ArrayList<>();

        int limit = Math.min(raw.size(), 10);
        for (int i = 0; i < limit; i++) {
            Object[] row = raw.get(i);
            result.add(TopItemResponse.builder()
                    .itemName((String) row[0])
                    .totalAmount((BigDecimal) row[1])
                    .build());
        }

        return result;
    }

    private void validateOwnership(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ApiException("Project not found", HttpStatus.NOT_FOUND));
    }

    private Double calculateChangePercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}