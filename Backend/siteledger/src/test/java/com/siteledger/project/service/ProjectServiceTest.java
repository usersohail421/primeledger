package com.siteledger.project.service;

import com.siteledger.auth.model.User;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.exception.ApiException;
import com.siteledger.project.dto.request.ProjectRequest;
import com.siteledger.project.dto.request.UpdateProjectRequest;
import com.siteledger.project.dto.response.ProjectResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService Unit Tests")
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

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
                .location("Pune, Maharashtra")
                .description("G+2 residential")
                .status(ProjectStatus.ACTIVE)
                .billSerialCounter(0)
                .user(mockUser)
                .build();
    }

    // ==================== CREATE PROJECT TESTS ====================

    @Test
    @DisplayName("Create project — success")
    void createProject_success() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Patel Bungalow");
        request.setLocation("Pune, Maharashtra");
        request.setDescription("G+2 residential");

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);

        ProjectResponse response = projectService.createProject(mockUser.getEmail(), request);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Patel Bungalow");
        assertThat(response.getStatus()).isEqualTo(ProjectStatus.ACTIVE);
        assertThat(response.getBillSerialCounter()).isEqualTo(0);

        verify(projectRepository).save(any(Project.class));
    }

    @Test
    @DisplayName("Create project — fail when user not found")
    void createProject_userNotFound_throwsException() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Patel Bungalow");

        when(userRepository.findByEmail("ghost@siteledger.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.createProject("ghost@siteledger.com", request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");

        verify(projectRepository, never()).save(any());
    }

    // ==================== GET ALL PROJECTS TESTS ====================

    @Test
    @DisplayName("Get all projects — success without status filter")
    void getAllProjects_noFilter_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Project> projectPage = new PageImpl<>(List.of(mockProject));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByUserId(mockUser.getId(), pageable)).thenReturn(projectPage);

        Page<ProjectResponse> response = projectService.getAllProjects(mockUser.getEmail(), null, pageable);

        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getName()).isEqualTo("Patel Bungalow");
    }

    @Test
    @DisplayName("Get all projects — success with status filter")
    void getAllProjects_withStatusFilter_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Project> projectPage = new PageImpl<>(List.of(mockProject));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByUserIdAndStatus(mockUser.getId(), ProjectStatus.ACTIVE, pageable))
                .thenReturn(projectPage);

        Page<ProjectResponse> response = projectService.getAllProjects(
                mockUser.getEmail(), ProjectStatus.ACTIVE, pageable);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getStatus()).isEqualTo(ProjectStatus.ACTIVE);
    }

    @Test
    @DisplayName("Get all projects — returns empty page when no projects")
    void getAllProjects_noProjects_returnsEmptyPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Project> emptyPage = new PageImpl<>(List.of());

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByUserId(mockUser.getId(), pageable)).thenReturn(emptyPage);

        Page<ProjectResponse> response = projectService.getAllProjects(mockUser.getEmail(), null, pageable);

        assertThat(response.getContent()).isEmpty();
    }

    // ==================== GET PROJECT BY ID TESTS ====================

    @Test
    @DisplayName("Get project by ID — success")
    void getProjectById_success() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));

        ProjectResponse response = projectService.getProjectById(mockUser.getEmail(), 1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Patel Bungalow");
    }

    @Test
    @DisplayName("Get project by ID — fail when project not found")
    void getProjectById_notFound_throwsException() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(99L, mockUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProjectById(mockUser.getEmail(), 99L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    @DisplayName("Get project by ID — fail when project belongs to another user")
    void getProjectById_wrongUser_throwsException() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProjectById(mockUser.getEmail(), 1L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Project not found");
    }

    // ==================== UPDATE PROJECT TESTS ====================

    @Test
    @DisplayName("Update project — success with partial fields")
    void updateProject_success() {
        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setName("Updated Bungalow");
        request.setStatus(ProjectStatus.ON_HOLD);

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);

        ProjectResponse response = projectService.updateProject(mockUser.getEmail(), 1L, request);

        assertThat(response).isNotNull();
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    @DisplayName("Update project — fail when project not found")
    void updateProject_notFound_throwsException() {
        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setName("Updated Name");

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(99L, mockUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.updateProject(mockUser.getEmail(), 99L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Project not found");

        verify(projectRepository, never()).save(any());
    }

    // ==================== DELETE PROJECT TESTS ====================

    @Test
    @DisplayName("Delete project — success sets status to ARCHIVED")
    void deleteProject_success() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);

        projectService.deleteProject(mockUser.getEmail(), 1L);

        assertThat(mockProject.getStatus()).isEqualTo(ProjectStatus.ARCHIVED);
        verify(projectRepository).save(mockProject);
    }

    @Test
    @DisplayName("Delete project — fail when project not found")
    void deleteProject_notFound_throwsException() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(99L, mockUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.deleteProject(mockUser.getEmail(), 99L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Project not found");

        verify(projectRepository, never()).save(any());
    }
}