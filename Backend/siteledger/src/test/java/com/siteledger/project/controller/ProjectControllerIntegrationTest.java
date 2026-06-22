package com.siteledger.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siteledger.auth.dto.request.RegisterRequest;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.project.dto.request.ProjectRequest;
import com.siteledger.project.dto.request.UpdateProjectRequest;
import com.siteledger.project.model.ProjectStatus;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("ProjectController Integration Tests")
class ProjectControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @BeforeEach
    void setUp() {
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
        request.setLocation("Pune, Maharashtra");
        request.setDescription("G+2 residential");

        MvcResult result = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(
                result.getResponse().getContentAsString()).get("id").asLong();
    }

    // ==================== CREATE PROJECT TESTS ====================

    @Test
    @DisplayName("Create project — 200 OK with valid data")
    void createProject_success() throws Exception {
        String token = registerAndGetToken();

        ProjectRequest request = new ProjectRequest();
        request.setName("Patel Bungalow");
        request.setLocation("Pune, Maharashtra");
        request.setDescription("G+2 residential");

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Patel Bungalow"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.billSerialCounter").value(0));
    }

    @Test
    @DisplayName("Create project — 400 Bad Request when name is missing")
    void createProject_missingName_returns400() throws Exception {
        String token = registerAndGetToken();

        ProjectRequest request = new ProjectRequest();
        request.setLocation("Pune");

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Create project — 401 Unauthorized without token")
    void createProject_noToken_returns401() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("Patel Bungalow");

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ==================== GET ALL PROJECTS TESTS ====================

    @Test
    @DisplayName("Get all projects — 200 OK returns list")
    void getAllProjects_success() throws Exception {
        String token = registerAndGetToken();
        createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].name").value("Patel Bungalow"));
    }

    @Test
    @DisplayName("Get all projects — 200 OK returns empty when no projects")
    void getAllProjects_empty_success() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    @DisplayName("Get all projects — filter by status ACTIVE")
    void getAllProjects_filterByStatus_success() throws Exception {
        String token = registerAndGetToken();
        createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects")
                        .param("status", "ACTIVE")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));
    }

    // ==================== GET PROJECT BY ID TESTS ====================

    @Test
    @DisplayName("Get project by ID — 200 OK")
    void getProjectById_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(get("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.name").value("Patel Bungalow"));
    }

    @Test
    @DisplayName("Get project by ID — 404 Not Found for wrong ID")
    void getProjectById_notFound_returns404() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(get("/api/projects/9999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ==================== UPDATE PROJECT TESTS ====================

    @Test
    @DisplayName("Update project — 200 OK with valid data")
    void updateProject_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setName("Updated Bungalow");
        request.setStatus(ProjectStatus.ON_HOLD);

        mockMvc.perform(put("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Bungalow"))
                .andExpect(jsonPath("$.status").value("ON_HOLD"));
    }

    @Test
    @DisplayName("Update project — 404 Not Found for wrong ID")
    void updateProject_notFound_returns404() throws Exception {
        String token = registerAndGetToken();

        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setName("Updated Name");

        mockMvc.perform(put("/api/projects/9999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE PROJECT TESTS ====================

    @Test
    @DisplayName("Delete project — 204 No Content success")
    void deleteProject_success() throws Exception {
        String token = registerAndGetToken();
        Long projectId = createProjectAndGetId(token);

        mockMvc.perform(delete("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/" + projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("Delete project — 404 Not Found for wrong ID")
    void deleteProject_notFound_returns404() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(delete("/api/projects/9999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}