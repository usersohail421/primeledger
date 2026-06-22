package com.siteledger.project.dto.request;

import com.siteledger.project.model.ProjectStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {

    @Size(max = 150, message = "Project name must not exceed 150 characters")
    private String name;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    private String description;

    private ProjectStatus status;
}