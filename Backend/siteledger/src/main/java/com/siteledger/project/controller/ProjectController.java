package com.siteledger.project.controller;

import com.siteledger.project.dto.request.ProjectRequest;
import com.siteledger.project.dto.request.UpdateProjectRequest;
import com.siteledger.project.dto.response.ProjectResponse;
import com.siteledger.project.model.ProjectStatus;
import com.siteledger.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project and site management")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @Operation(summary = "Create a new project")
    public ResponseEntity<ProjectResponse> createProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.createProject(userDetails.getUsername(), request));
    }

    @GetMapping
    @Operation(summary = "Get all projects for logged in user")
    public ResponseEntity<Page<ProjectResponse>> getAllProjects(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(projectService.getAllProjects(userDetails.getUsername(), status, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ProjectResponse> getProjectById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(userDetails.getUsername(), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project")
    public ResponseEntity<ProjectResponse> updateProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Archive project")
    public ResponseEntity<Void> deleteProject(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        projectService.deleteProject(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}