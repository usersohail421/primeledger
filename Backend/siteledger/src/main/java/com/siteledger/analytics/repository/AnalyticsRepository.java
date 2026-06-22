package com.siteledger.analytics.repository;

import com.siteledger.bill.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Bill, Long> {

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.project.id = :projectId")
    BigDecimal getTotalSpentByProject(@Param("projectId") Long projectId);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.project.id = :projectId " +
            "AND MONTH(b.billDate) = MONTH(CURRENT_DATE) " +
            "AND YEAR(b.billDate) = YEAR(CURRENT_DATE)")
    Long getBillsRaisedThisMonth(@Param("projectId") Long projectId);

    @Query("SELECT COALESCE(SUM(bi.amount), 0) FROM BillItem bi " +
            "WHERE bi.bill.project.id = :projectId " +
            "AND bi.bill.billDate >= :weekStart " +
            "AND bi.bill.billDate <= :weekEnd")
    BigDecimal getSpendBetweenDates(
            @Param("projectId") Long projectId,
            @Param("weekStart") LocalDate weekStart,
            @Param("weekEnd") LocalDate weekEnd);

    @Query("SELECT bi.bill.billDate, COALESCE(SUM(bi.amount), 0) " +
            "FROM BillItem bi " +
            "WHERE bi.bill.project.id = :projectId " +
            "AND bi.bill.billDate >= :from " +
            "GROUP BY YEAR(bi.bill.billDate), WEEK(bi.bill.billDate), bi.bill.billDate " +
            "ORDER BY bi.bill.billDate ASC")
    List<Object[]> getWeeklySpendRaw(
            @Param("projectId") Long projectId,
            @Param("from") LocalDate from);

    @Query(value = "SELECT LOWER(bi.item_name) as item_name, COALESCE(SUM(bi.amount), 0) as total " +
            "FROM bill_items bi " +
            "JOIN bills b ON bi.bill_id = b.id " +
            "WHERE b.project_id = :projectId " +
            "GROUP BY LOWER(bi.item_name) " +
            "ORDER BY total DESC " +
            "LIMIT 10",
            nativeQuery = true)
    List<Object[]> getTopItemsRaw(@Param("projectId") Long projectId);
}