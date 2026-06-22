package com.siteledger.project.service;

import com.siteledger.project.dto.request.ProjectRequest;
import com.siteledger.project.dto.request.UpdateProjectRequest;
import com.siteledger.project.dto.response.ProjectResponse;
import com.siteledger.exception.ApiException;
import com.siteledger.project.model.Project;
import com.siteledger.project.model.ProjectStatus;
import com.siteledger.auth.model.User;
import com.siteledger.project.repository.ProjectRepository;
import com.siteledger.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectResponse createProject(String email, ProjectRequest request) {
        User user = getUser(email);

        Project project = Project.builder()
                .name(request.getName())
                .location(request.getLocation())
                .description(request.getDescription())
                .status(ProjectStatus.ACTIVE)
                .billSerialCounter(0)
                .user(user)
                .build();

        projectRepository.save(project);
        return toResponse(project);
    }

    public Page<ProjectResponse> getAllProjects(String email, ProjectStatus status, Pageable pageable) {
        User user = getUser(email);

        if (status != null) {
            return projectRepository.findByUserIdAndStatus(user.getId(), status, pageable)
                    .map(this::toResponse);
        }
        return projectRepository.findByUserId(user.getId(), pageable)
                .map(this::toResponse);
    }

    public ProjectResponse getProjectById(String email, Long projectId) {
        User user = getUser(email);
        Project project = getOwnedProject(projectId, user.getId());
        return toResponse(project);
    }

    public ProjectResponse updateProject(String email, Long projectId, UpdateProjectRequest request) {
        User user = getUser(email);
        Project project = getOwnedProject(projectId, user.getId());

        if (request.getName() != null) project.setName(request.getName());
        if (request.getLocation() != null) project.setLocation(request.getLocation());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());

        projectRepository.save(project);
        return toResponse(project);
    }

    public void deleteProject(String email, Long projectId) {
        User user = getUser(email);
        Project project = getOwnedProject(projectId, user.getId());
        project.setStatus(ProjectStatus.ARCHIVED);
        projectRepository.save(project);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }

    private Project getOwnedProject(Long projectId, Long userId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ApiException("Project not found", HttpStatus.NOT_FOUND));
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .location(project.getLocation())
                .description(project.getDescription())
                .status(project.getStatus())
                .billSerialCounter(project.getBillSerialCounter())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}