package com.siteledger.project.dto.response;

import com.siteledger.project.model.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private String location;
    private String description;
    private ProjectStatus status;
    private Integer billSerialCounter;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}