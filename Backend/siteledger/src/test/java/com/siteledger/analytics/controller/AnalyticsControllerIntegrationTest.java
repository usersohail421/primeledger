package com.siteledger.analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siteledger.auth.dto.request.RegisterRequest;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.bill.dto.request.BillItemRequest;
import com.siteledger.bill.dto.request.BillRequest;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.project.dto.request.ProjectRequest;
import com.siteledger.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AnalyticsController Integration Tests")
class AnalyticsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private BillRepository billRepository;

    @BeforeEach
    void setUp() {
        billRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String registerAndGetToken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(
                result.getResponse().getContentAsString()).get("token").asText();
    }

    private Long createProjectAndGetId(String token) throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("Patel Bungalow");
        request.setLocation("Pune");

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(
                result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void createBill(String token, Long projectId, String itemName, BigDecimal amount)
            throws Exception {
        BillItemRequest item = new BillItemRequest();
        item.setItemName(itemName);
        item.setAmount(amount);

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setItems(List.of(item));

        mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    // ==================== SUMMARY TESTS ====================

    @Test
    @DisplayName("Get summary — 200 OK with correct totals")
    void getSummary_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        createBill(token, projectId, "Sand", new BigDecimal("10000"));
        createBill(token, projectId, "Cement", new BigDecimal("15000"));

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmountSpent").value(25000))
                .andExpect(jsonPath("$.totalBillCount").value(2))
                .andExpect(jsonPath("$.billsRaisedThisMonth").value(2));
    }

    @Test
    @DisplayName("Get summary — 200 OK with zero values when no bills")
    void getSummary_noBills_returnsZero() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmountSpent").value(0))
                .andExpect(jsonPath("$.totalBillCount").value(0));
    }

    @Test
    @DisplayName("Get summary — 404 Not Found for wrong project")
    void getSummary_wrongProject_returns404() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get("/api/projects/9999/analytics/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Get summary — 401 Unauthorized without token")
    void getSummary_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/projects/1/analytics/summary"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== WEEKLY SPEND TESTS ====================

    @Test
    @DisplayName("Get weekly spend — 200 OK returns array")
    void getWeeklySpend_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        createBill(token, projectId, "Sand", new BigDecimal("10000"));

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/weekly")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Get weekly spend — 200 OK returns empty array when no bills")
    void getWeeklySpend_noBills_returnsEmpty() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/weekly")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ==================== WEEK COMPARISON TESTS ====================

    @Test
    @DisplayName("Get week comparison — 200 OK returns trend data")
    void getWeekComparison_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        createBill(token, projectId, "Sand", new BigDecimal("10000"));

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/week-comparison")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thisWeekSpend").exists())
                .andExpect(jsonPath("$.lastWeekSpend").exists())
                .andExpect(jsonPath("$.trend").exists());
    }

    @Test
    @DisplayName("Get week comparison — trend is NEUTRAL when no previous data")
    void getWeekComparison_noData_trendNeutral() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/week-comparison")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trend").value("NEUTRAL"));
    }

    // ==================== TOP ITEMS TESTS ====================

    @Test
    @DisplayName("Get top items — 200 OK returns ranked items")
    void getTopItems_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        createBill(token, projectId, "Sand", new BigDecimal("10000"));
        createBill(token, projectId, "Cement", new BigDecimal("15000"));
        createBill(token, projectId, "Sand", new BigDecimal("5000"));

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/top-items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("Get top items — 200 OK returns empty when no bills")
    void getTopItems_noBills_returnsEmpty() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId + "/analytics/top-items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("Get top items — 404 Not Found for wrong project")
    void getTopItems_wrongProject_returns404() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get("/api/projects/9999/analytics/top-items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}