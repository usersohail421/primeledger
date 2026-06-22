package com.siteledger.bill.service;

import com.siteledger.auth.model.User;
import com.siteledger.bill.dto.request.BillItemRequest;
import com.siteledger.bill.dto.request.BillRequest;
import com.siteledger.bill.dto.response.BillItemResponse;
import com.siteledger.bill.dto.response.BillResponse;
import com.siteledger.bill.dto.response.ItemSearchResponse;
import com.siteledger.bill.model.Bill;
import com.siteledger.bill.model.BillAuditLog;
import com.siteledger.bill.model.BillItem;
import com.siteledger.exception.ApiException;
import com.siteledger.project.model.Project;
import com.siteledger.project.model.ProjectStatus;
import com.siteledger.bill.repository.BillAuditLogRepository;
import com.siteledger.bill.repository.BillItemRepository;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.project.repository.ProjectRepository;
import com.siteledger.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final BillAuditLogRepository billAuditLogRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public BillResponse createBill(String email, Long projectId, BillRequest request) {
        User user = getUser(email);
        Project project = getOwnedProject(projectId, user.getId());

        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new ApiException(
                    "Bills can only be created for active projects. " +
                            "This project is currently " + project.getStatus().name().toLowerCase() + ".",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (request.getBillPeriodStart() != null && request.getBillPeriodEnd() != null) {

            if (!request.getBillPeriodStart().isBefore(request.getBillPeriodEnd())) {
                throw new ApiException(
                        "Bill period start date must be before end date",
                        HttpStatus.BAD_REQUEST
                );
            }

            boolean exactDuplicate = billRepository
                    .existsByProjectIdAndBillPeriodStartAndBillPeriodEnd(
                            projectId,
                            request.getBillPeriodStart(),
                            request.getBillPeriodEnd()
                    );
            if (exactDuplicate) {
                throw new ApiException(
                        "A bill already exists for this period. Please use a different date range.",
                        HttpStatus.CONFLICT
                );
            }

            boolean overlaps = billRepository.existsOverlappingBill(
                    projectId,
                    request.getBillPeriodStart(),
                    request.getBillPeriodEnd()
            );
            if (overlaps) {
                throw new ApiException(
                        "Bill period overlaps with an existing bill. Please check your dates.",
                        HttpStatus.CONFLICT
                );
            }
        }

        int counter = project.getBillSerialCounter() + 1;
        project.setBillSerialCounter(counter);
        projectRepository.save(project);

        String billNumber = generateBillNumber(project.getName(), counter);

        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .billDate(request.getBillDate() != null ? request.getBillDate() : LocalDate.now())
                .billPeriodStart(request.getBillPeriodStart())
                .billPeriodEnd(request.getBillPeriodEnd())
                .totalAmount(BigDecimal.ZERO)
                .project(project)
                .createdBy(user)
                .items(new ArrayList<>())
                .build();

        List<BillItem> items = new ArrayList<>();
        for (int i = 0; i < request.getItems().size(); i++) {
            BillItemRequest itemRequest = request.getItems().get(i);
            BillItem item = BillItem.builder()
                    .itemName(itemRequest.getItemName())
                    .expenseDate(itemRequest.getExpenseDate())
                    .amount(itemRequest.getAmount())
                    .sortOrder(i)
                    .bill(bill)
                    .build();
            items.add(item);
        }

        bill.setItems(items);
        bill.setTotalAmount(calculateTotal(items));
        billRepository.save(bill);

        return toResponse(bill);
    }

    @Transactional(readOnly = true)
    public Page<BillResponse> getBillsByProject(
            String email, Long projectId,
            LocalDate from, LocalDate to,
            Pageable pageable) {
        User user = getUser(email);
        getOwnedProject(projectId, user.getId());

        if (from != null && to != null) {
            return billRepository.findByProjectIdAndBillDateBetween(
                            projectId, from, to, pageable)
                    .map(this::toResponse);
        }
        return billRepository.findByProjectId(projectId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public BillResponse getBillById(String email, Long projectId, Long billId) {
        User user = getUser(email);
        getOwnedProject(projectId, user.getId());

        Bill bill = billRepository.findByIdAndProjectId(billId, projectId)
                .orElseThrow(() -> new ApiException("Bill not found", HttpStatus.NOT_FOUND));

        return toResponse(bill);
    }

    @Transactional
    public BillResponse updateBill(String email, Long projectId, Long billId, BillRequest request) {
        User user = getUser(email);
        getOwnedProject(projectId, user.getId());

        Bill bill = billRepository.findByIdAndProjectId(billId, projectId)
                .orElseThrow(() -> new ApiException("Bill not found", HttpStatus.NOT_FOUND));

        if (request.getBillDate() != null) bill.setBillDate(request.getBillDate());
        if (request.getBillPeriodStart() != null) bill.setBillPeriodStart(request.getBillPeriodStart());
        if (request.getBillPeriodEnd() != null) bill.setBillPeriodEnd(request.getBillPeriodEnd());

        bill.getItems().clear();
        List<BillItem> newItems = new ArrayList<>();
        for (int i = 0; i < request.getItems().size(); i++) {
            BillItemRequest itemRequest = request.getItems().get(i);
            BillItem item = BillItem.builder()
                    .itemName(itemRequest.getItemName())
                    .expenseDate(itemRequest.getExpenseDate())
                    .amount(itemRequest.getAmount())
                    .sortOrder(i)
                    .bill(bill)
                    .build();
            newItems.add(item);
        }

        bill.getItems().addAll(newItems);
        bill.setTotalAmount(calculateTotal(newItems));
        billRepository.save(bill);

        return toResponse(bill);
    }

    @Transactional
    public void deleteBill(String email, Long projectId, Long billId) {
        User user = getUser(email);
        getOwnedProject(projectId, user.getId());

        Bill bill = billRepository.findByIdAndProjectId(billId, projectId)
                .orElseThrow(() -> new ApiException("Bill not found", HttpStatus.NOT_FOUND));

        // Save audit log before deleting
        BillAuditLog auditLog = BillAuditLog.builder()
                .billId(bill.getId())
                .billNumber(bill.getBillNumber())
                .projectId(bill.getProject().getId())
                .projectName(bill.getProject().getName())
                .totalAmount(bill.getTotalAmount())
                .deletedById(user.getId())
                .deletedByName(user.getName())
                .deletedByEmail(user.getEmail())
                .deletedAt(LocalDateTime.now())
                .build();

        billAuditLogRepository.save(auditLog);
        billRepository.delete(bill);
    }

    @Transactional(readOnly = true)
    public ItemSearchResponse searchItems(String email, Long projectId, String keyword) {
        User user = getUser(email);
        getOwnedProject(projectId, user.getId());

        if (keyword == null || keyword.trim().isEmpty()) {
            throw new ApiException("Search keyword cannot be empty", HttpStatus.BAD_REQUEST);
        }

        List<BillItem> items = billItemRepository.searchByItemNameInProject(
                projectId, keyword.trim());

        List<ItemSearchResponse.ItemSearchResult> results = items.stream()
                .map(item -> ItemSearchResponse.ItemSearchResult.builder()
                        .id(item.getId())
                        .itemName(item.getItemName())
                        .expenseDate(item.getExpenseDate())
                        .amount(item.getAmount())
                        .billNumber(item.getBill().getBillNumber())
                        .billDate(item.getBill().getBillDate())
                        .build())
                .toList();

        BigDecimal totalAmount = results.stream()
                .map(ItemSearchResponse.ItemSearchResult::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ItemSearchResponse.builder()
                .keyword(keyword.trim())
                .items(results)
                .totalAmount(totalAmount)
                .itemCount(results.size())
                .build();
    }

    private String generateBillNumber(String projectName, int counter) {
        String prefix = projectName
                .trim()
                .toUpperCase()
                .replaceAll("[^A-Z0-9]", "")
                .substring(0, Math.min(projectName.replaceAll("[^A-Za-z0-9]", "").length(), 5));
        return prefix + "-" + String.format("%03d", counter);
    }

    private BigDecimal calculateTotal(List<BillItem> items) {
        return items.stream()
                .map(BillItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }

    private Project getOwnedProject(Long projectId, Long userId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ApiException("Project not found", HttpStatus.NOT_FOUND));
    }

    private BillResponse toResponse(Bill bill) {
        List<BillItemResponse> itemResponses = bill.getItems().stream()
                .map(item -> BillItemResponse.builder()
                        .id(item.getId())
                        .itemName(item.getItemName())
                        .expenseDate(item.getExpenseDate())
                        .amount(item.getAmount())
                        .sortOrder(item.getSortOrder())
                        .build())
                .toList();

        return BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .billDate(bill.getBillDate())
                .billPeriodStart(bill.getBillPeriodStart())
                .billPeriodEnd(bill.getBillPeriodEnd())
                .totalAmount(bill.getTotalAmount())
                .projectId(bill.getProject().getId())
                .projectName(bill.getProject().getName())
                .items(itemResponses)
                .createdAt(bill.getCreatedAt())
                .updatedAt(bill.getUpdatedAt())
                .build();
    }
}