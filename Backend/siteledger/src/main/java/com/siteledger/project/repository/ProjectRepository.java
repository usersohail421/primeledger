package com.siteledger.project.repository;

import com.siteledger.project.model.Project;
import com.siteledger.project.model.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Page<Project> findByUserId(Long userId, Pageable pageable);

    Page<Project> findByUserIdAndStatus(Long userId, ProjectStatus status, Pageable pageable);

    Optional<Project> findByIdAndUserId(Long id, Long userId);

    List<Project> findByUserIdAndStatus(Long userId, ProjectStatus status);
}