package com.siteledger.bill.repository;

import com.siteledger.bill.model.BillAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillAuditLogRepository extends JpaRepository<BillAuditLog, Long> {
    List<BillAuditLog> findByProjectIdOrderByDeletedAtDesc(Long projectId);
}