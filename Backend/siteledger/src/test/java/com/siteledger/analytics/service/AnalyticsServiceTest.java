package com.siteledger.analytics.service;

import com.siteledger.analytics.dto.response.ProjectSummaryResponse;
import com.siteledger.analytics.dto.response.TopItemResponse;
import com.siteledger.analytics.dto.response.WeekComparisonResponse;
import com.siteledger.analytics.dto.response.WeeklySpendResponse;
import com.siteledger.analytics.repository.AnalyticsRepository;
import com.siteledger.auth.model.User;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.exception.ApiException;
import com.siteledger.project.model.Project;
import com.siteledger.project.model.ProjectStatus;
import com.siteledger.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService Unit Tests")
class AnalyticsServiceTest {

    @Mock
    private AnalyticsRepository analyticsRepository;

    @Mock
    private BillRepository billRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User mockUser;
    private Project mockProject;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .name("Sohail Shaikh")
                .email("sohail@siteledger.com")
                .password("encodedPassword")
                .build();

        mockProject = Project.builder()
                .id(1L)
                .name("Patel Bungalow")
                .status(ProjectStatus.ACTIVE)
                .billSerialCounter(3)
                .user(mockUser)
                .build();
    }

    // ==================== PROJECT SUMMARY TESTS ====================

    @Test
    @DisplayName("Get project summary — success with all data")
    void getProjectSummary_success() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getTotalSpentByProject(1L))
                .thenReturn(new BigDecimal("80000"));
        when(billRepository.countByProjectId(1L)).thenReturn(3L);
        when(analyticsRepository.getBillsRaisedThisMonth(1L)).thenReturn(2L);
        when(analyticsRepository.getSpendBetweenDates(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("25000"), new BigDecimal("20000"));

        ProjectSummaryResponse response = analyticsService.getProjectSummary(
                mockUser.getEmail(), 1L);

        assertThat(response).isNotNull();
        assertThat(response.getTotalAmountSpent()).isEqualByComparingTo(new BigDecimal("80000"));
        assertThat(response.getTotalBillCount()).isEqualTo(3L);
        assertThat(response.getBillsRaisedThisMonth()).isEqualTo(2L);
        assertThat(response.getThisWeekSpend()).isEqualByComparingTo(new BigDecimal("25000"));
        assertThat(response.getLastWeekSpend()).isEqualByComparingTo(new BigDecimal("20000"));
        assertThat(response.getWeekOnWeekChangePercent()).isNotNull();
    }

    @Test
    @DisplayName("Get project summary — week change percent is null when last week is zero")
    void getProjectSummary_lastWeekZero_changePercentNull() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getTotalSpentByProject(1L)).thenReturn(BigDecimal.ZERO);
        when(billRepository.countByProjectId(1L)).thenReturn(0L);
        when(analyticsRepository.getBillsRaisedThisMonth(1L)).thenReturn(0L);
        when(analyticsRepository.getSpendBetweenDates(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("10000"), BigDecimal.ZERO);

        ProjectSummaryResponse response = analyticsService.getProjectSummary(
                mockUser.getEmail(), 1L);

        assertThat(response.getWeekOnWeekChangePercent()).isNull();
    }

    @Test
    @DisplayName("Get project summary — fail when user not found")
    void getProjectSummary_userNotFound_throwsException() {
        when(userRepository.findByEmail("ghost@siteledger.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.getProjectSummary("ghost@siteledger.com", 1L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("Get project summary — fail when project not found")
    void getProjectSummary_projectNotFound_throwsException() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(99L, mockUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.getProjectSummary(mockUser.getEmail(), 99L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Project not found");
    }

    // ==================== WEEKLY SPEND TESTS ====================

    @Test
    @DisplayName("Get weekly spend — success returns grouped weeks")
    void getWeeklySpend_success() {
        LocalDate monday = LocalDate.now().with(java.time.DayOfWeek.MONDAY);

        Object[] row1 = {monday, new BigDecimal("10000")};
        Object[] row2 = {monday.plusDays(1), new BigDecimal("5000")};

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getWeeklySpendRaw(eq(1L), any(LocalDate.class)))
                .thenReturn(List.of(row1, row2));

        List<WeeklySpendResponse> response = analyticsService.getWeeklySpend(
                mockUser.getEmail(), 1L);

        assertThat(response).isNotNull();
        assertThat(response).hasSize(1);
        assertThat(response.get(0).getTotalAmount())
                .isEqualByComparingTo(new BigDecimal("15000"));
    }

    @Test
    @DisplayName("Get weekly spend — returns empty list when no data")
    void getWeeklySpend_noData_returnsEmpty() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getWeeklySpendRaw(eq(1L), any(LocalDate.class)))
                .thenReturn(List.of());

        List<WeeklySpendResponse> response = analyticsService.getWeeklySpend(
                mockUser.getEmail(), 1L);

        assertThat(response).isEmpty();
    }

    @Test
    @DisplayName("Get weekly spend — multiple weeks grouped correctly")
    void getWeeklySpend_multipleWeeks_groupedCorrectly() {
        LocalDate thisMonday = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        LocalDate lastMonday = thisMonday.minusWeeks(1);

        Object[] row1 = {thisMonday, new BigDecimal("10000")};
        Object[] row2 = {lastMonday, new BigDecimal("8000")};

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getWeeklySpendRaw(eq(1L), any(LocalDate.class)))
                .thenReturn(List.of(row1, row2));

        List<WeeklySpendResponse> response = analyticsService.getWeeklySpend(
                mockUser.getEmail(), 1L);

        assertThat(response).hasSize(2);
    }

    // ==================== WEEK COMPARISON TESTS ====================

    @Test
    @DisplayName("Week comparison — trend is UP when this week higher")
    void getWeekComparison_trendUp() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getSpendBetweenDates(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("30000"), new BigDecimal("20000"));

        WeekComparisonResponse response = analyticsService.getWeekComparison(
                mockUser.getEmail(), 1L);

        assertThat(response).isNotNull();
        assertThat(response.getTrend()).isEqualTo("UP");
        assertThat(response.getChangePercent()).isPositive();
        assertThat(response.getThisWeekSpend()).isEqualByComparingTo(new BigDecimal("30000"));
        assertThat(response.getLastWeekSpend()).isEqualByComparingTo(new BigDecimal("20000"));
    }

    @Test
    @DisplayName("Week comparison — trend is DOWN when this week lower")
    void getWeekComparison_trendDown() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getSpendBetweenDates(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("10000"), new BigDecimal("20000"));

        WeekComparisonResponse response = analyticsService.getWeekComparison(
                mockUser.getEmail(), 1L);

        assertThat(response.getTrend()).isEqualTo("DOWN");
        assertThat(response.getChangePercent()).isNegative();
    }

    @Test
    @DisplayName("Week comparison — trend is NEUTRAL when last week is zero")
    void getWeekComparison_trendNeutral_lastWeekZero() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getSpendBetweenDates(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("10000"), BigDecimal.ZERO);

        WeekComparisonResponse response = analyticsService.getWeekComparison(
                mockUser.getEmail(), 1L);

        assertThat(response.getTrend()).isEqualTo("NEUTRAL");
        assertThat(response.getChangePercent()).isNull();
    }

    // ==================== TOP ITEMS TESTS ====================

    @Test
    @DisplayName("Get top items — success returns top 10")
    void getTopItems_success() {
        Object[] row1 = {"sand", new BigDecimal("50000")};
        Object[] row2 = {"cement", new BigDecimal("40000")};
        Object[] row3 = {"labour", new BigDecimal("30000")};

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getTopItemsRaw(1L))
                .thenReturn(List.of(row1, row2, row3));

        List<TopItemResponse> response = analyticsService.getTopItems(mockUser.getEmail(), 1L);

        assertThat(response).hasSize(3);
        assertThat(response.get(0).getItemName()).isEqualTo("sand");
        assertThat(response.get(0).getTotalAmount()).isEqualByComparingTo(new BigDecimal("50000"));
        assertThat(response.get(1).getItemName()).isEqualTo("cement");
    }

    @Test
    @DisplayName("Get top items — returns empty list when no data")
    void getTopItems_noData_returnsEmpty() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getTopItemsRaw(1L)).thenReturn(List.of());

        List<TopItemResponse> response = analyticsService.getTopItems(mockUser.getEmail(), 1L);

        assertThat(response).isEmpty();
    }

    @Test
    @DisplayName("Get top items — limits to 10 even if more exist")
    void getTopItems_limitsToTen() {
        List<Object[]> rawData = new java.util.ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            rawData.add(new Object[]{"item" + i, new BigDecimal(i * 1000)});
        }

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(analyticsRepository.getTopItemsRaw(1L)).thenReturn(rawData);

        List<TopItemResponse> response = analyticsService.getTopItems(mockUser.getEmail(), 1L);

        assertThat(response).hasSize(10);
    }
}