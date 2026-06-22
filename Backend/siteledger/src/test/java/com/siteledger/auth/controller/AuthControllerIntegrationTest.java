package com.siteledger.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siteledger.auth.dto.request.LoginRequest;
import com.siteledger.auth.dto.request.RegisterRequest;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.bill.repository.BillRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

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

        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    // ==================== REGISTER TESTS ====================

    @Test
    @DisplayName("Register — 200 OK with valid details")
    void register_success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("sohail@siteledger.com"))
                .andExpect(jsonPath("$.name").value("Sohail Shaikh"));
    }

    @Test
    @DisplayName("Register — 409 Conflict when email already exists")
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    @DisplayName("Register — 400 Bad Request when name is missing")
    void register_missingName_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Register — 400 Bad Request when password too short")
    void register_shortPassword_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("sohail@siteledger.com");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Register — 400 Bad Request when email is invalid")
    void register_invalidEmail_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("notanemail");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==================== LOGIN TESTS ====================

    @Test
    @DisplayName("Login — 200 OK with correct credentials")
    void login_success() throws Exception {
        registerAndGetToken();

        LoginRequest request = new LoginRequest();
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("sohail@siteledger.com"));
    }

    @Test
    @DisplayName("Login — 401 Unauthorized with wrong password")
    void login_wrongPassword_returns401() throws Exception {
        registerAndGetToken();

        LoginRequest request = new LoginRequest();
        request.setEmail("sohail@siteledger.com");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ==================== PROFILE TESTS ====================

    @Test
    @DisplayName("Get profile — 200 OK with valid token")
    void getProfile_success() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get("/api/auth/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("sohail@siteledger.com"))
                .andExpect(jsonPath("$.name").value("Sohail Shaikh"));
    }

    @Test
    @DisplayName("Get profile — 401 Unauthorized without token")
    void getProfile_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/profile"))
                .andExpect(status().isUnauthorized());
    }
}