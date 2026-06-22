package com.siteledger.bill.repository;

import com.siteledger.bill.model.Bill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    Page<Bill> findByProjectId(Long projectId, Pageable pageable);

    Page<Bill> findByProjectIdAndBillDateBetween(
            Long projectId, LocalDate from, LocalDate to, Pageable pageable);

    Optional<Bill> findByIdAndProjectId(Long id, Long projectId);

    Long countByProjectId(Long projectId);

    boolean existsByProjectIdAndBillPeriodStartAndBillPeriodEnd(
            Long projectId,
            LocalDate billPeriodStart,
            LocalDate billPeriodEnd
    );

    @Query("SELECT COUNT(b) > 0 FROM Bill b WHERE b.project.id = :projectId " +
            "AND b.billPeriodStart IS NOT NULL " +
            "AND b.billPeriodEnd IS NOT NULL " +
            "AND b.billPeriodStart <= :periodEnd " +
            "AND b.billPeriodEnd >= :periodStart")
    boolean existsOverlappingBill(
            @Param("projectId") Long projectId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd
    );

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b " +
            "WHERE b.project.id = :projectId")
    BigDecimal sumTotalAmountByProjectId(@Param("projectId") Long projectId);
}