package com.siteledger.bill.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_id", nullable = false)
    private Long billId;

    @Column(name = "bill_number", nullable = false, length = 50)
    private String billNumber;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "project_name", nullable = false, length = 150)
    private String projectName;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "deleted_by_id", nullable = false)
    private Long deletedById;

    @Column(name = "deleted_by_name", nullable = false, length = 100)
    private String deletedByName;

    @Column(name = "deleted_by_email", nullable = false, length = 150)
    private String deletedByEmail;

    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt;
}