package com.siteledger.bill.controller;

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
@DisplayName("BillController Integration Tests")
class BillControllerIntegrationTest {

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

    private Long createBillAndGetId(String token, Long projectId) throws Exception {
        BillItemRequest item1 = new BillItemRequest();
        item1.setItemName("Sand");
        item1.setAmount(new BigDecimal("10000"));

        BillItemRequest item2 = new BillItemRequest();
        item2.setItemName("Cement");
        item2.setAmount(new BigDecimal("15000"));

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setBillPeriodStart(LocalDate.now().minusDays(7));
        request.setBillPeriodEnd(LocalDate.now());
        request.setItems(List.of(item1, item2));

        MvcResult result = mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(
                result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @DisplayName("Create bill — 200 OK with valid data")
    void createBill_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        BillItemRequest item = new BillItemRequest();
        item.setItemName("Sand");
        item.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setItems(List.of(item));

        mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billNumber").isNotEmpty())
                .andExpect(jsonPath("$.totalAmount").value(10000))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].itemName").value("Sand"));
    }

    @Test
    @DisplayName("Create bill — total calculated correctly for multiple items")
    void createBill_multipleItems_correctTotal() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        BillItemRequest item1 = new BillItemRequest();
        item1.setItemName("Sand");
        item1.setAmount(new BigDecimal("10000"));

        BillItemRequest item2 = new BillItemRequest();
        item2.setItemName("Cement");
        item2.setAmount(new BigDecimal("15000"));

        BillItemRequest item3 = new BillItemRequest();
        item3.setItemName("Labour");
        item3.setAmount(new BigDecimal("8000"));

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setItems(List.of(item1, item2, item3));

        mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(33000))
                .andExpect(jsonPath("$.items.length()").value(3));
    }

    @Test
    @DisplayName("Create bill — 400 Bad Request when items list is empty")
    void createBill_emptyItems_returns400() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setItems(List.of());

        mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Create bill — 404 Not Found for wrong project")
    void createBill_wrongProject_returns404() throws Exception {
        String token = registerAndGetToken();

        BillItemRequest item = new BillItemRequest();
        item.setItemName("Sand");
        item.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setItems(List.of(item));

        mockMvc.perform(post("/api/projects/9999/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Create bill — bill number increments per project")
    void createBill_billNumberIncrements() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        BillItemRequest item = new BillItemRequest();
        item.setItemName("Sand");
        item.setAmount(new BigDecimal("5000"));

        BillRequest request = new BillRequest();
        request.setItems(List.of(item));

        MvcResult result1 = mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult result2 = mockMvc.perform(post("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String billNumber1 = objectMapper.readTree(
                result1.getResponse().getContentAsString()).get("billNumber").asText();
        String billNumber2 = objectMapper.readTree(
                result2.getResponse().getContentAsString()).get("billNumber").asText();

        org.assertj.core.api.Assertions.assertThat(billNumber1).endsWith("-001");
        org.assertj.core.api.Assertions.assertThat(billNumber2).endsWith("-002");
    }

    @Test
    @DisplayName("Get bills — 200 OK returns list")
    void getBills_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        createBillAndGetId(token, projectId);

        mockMvc.perform(get("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].billNumber").isNotEmpty());
    }

    @Test
    @DisplayName("Get bills — 200 OK returns empty when no bills")
    void getBills_empty_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId + "/bills")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    @DisplayName("Get bill by ID — 200 OK")
    void getBillById_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        Long billId = createBillAndGetId(token, projectId);

        mockMvc.perform(get("/api/projects/" + projectId + "/bills/" + billId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(billId))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalAmount").value(25000));
    }

    @Test
    @DisplayName("Get bill by ID — 404 Not Found for wrong ID")
    void getBillById_notFound_returns404() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId + "/bills/9999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Update bill — 200 OK replaces items and recalculates total")
    void updateBill_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        Long billId = createBillAndGetId(token, projectId);

        BillItemRequest newItem = new BillItemRequest();
        newItem.setItemName("Bricks");
        newItem.setAmount(new BigDecimal("20000"));

        BillRequest updateRequest = new BillRequest();
        updateRequest.setItems(List.of(newItem));

        mockMvc.perform(put("/api/projects/" + projectId + "/bills/" + billId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(20000))
                .andExpect(jsonPath("$.items[0].itemName").value("Bricks"));
    }

    @Test
    @DisplayName("Update bill — 404 Not Found for wrong bill ID")
    void updateBill_notFound_returns404() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        BillItemRequest item = new BillItemRequest();
        item.setItemName("Sand");
        item.setAmount(new BigDecimal("5000"));

        BillRequest request = new BillRequest();
        request.setItems(List.of(item));

        mockMvc.perform(put("/api/projects/" + projectId + "/bills/9999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Delete bill — 204 No Content and bill is permanently removed")
    void deleteBill_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);
        Long billId = createBillAndGetId(token, projectId);

        mockMvc.perform(delete("/api/projects/" + projectId + "/bills/" + billId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/" + projectId + "/bills/" + billId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Delete bill — 404 Not Found for wrong bill ID")
    void deleteBill_notFound_returns404() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(delete("/api/projects/" + projectId + "/bills/9999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("All bill endpoints — 401 Unauthorized without token")
    void billEndpoints_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/projects/1/bills"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/projects/1/bills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}