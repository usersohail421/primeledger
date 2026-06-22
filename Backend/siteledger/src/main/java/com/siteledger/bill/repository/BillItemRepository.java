package com.siteledger.bill.repository;

import com.siteledger.bill.model.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillItemRepository extends JpaRepository<BillItem, Long> {

    List<BillItem> findByBillIdOrderBySortOrderAsc(Long billId);

    @Query("SELECT bi FROM BillItem bi " +
            "JOIN bi.bill b " +
            "WHERE b.project.id = :projectId " +
            "AND LOWER(bi.itemName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY bi.expenseDate DESC")
    List<BillItem> searchByItemNameInProject(
            @Param("projectId") Long projectId,
            @Param("keyword") String keyword
    );
}