package com.siteledger.bill.service;

import com.siteledger.auth.model.User;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.bill.model.BillAuditLog;
import com.siteledger.bill.repository.BillAuditLogRepository;
import com.siteledger.bill.dto.request.BillItemRequest;
import com.siteledger.bill.dto.request.BillRequest;
import com.siteledger.bill.dto.response.BillResponse;
import com.siteledger.bill.model.Bill;
import com.siteledger.bill.model.BillItem;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.exception.ApiException;
import com.siteledger.project.model.Project;
import com.siteledger.project.model.ProjectStatus;
import com.siteledger.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillService Unit Tests")
class BillServiceTest {

    @Mock
    private BillRepository billRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BillAuditLogRepository billAuditLogRepository;

    @InjectMocks
    private BillService billService;

    private User mockUser;
    private Project mockProject;
    private Bill mockBill;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .name("Sohail Shaikh")
                .email("sohail@siteledger.com")
                .password("encodedPassword")
                .build();

        mockProject = Project.builder()
                .id(1L)
                .name("Patel Bungalow")
                .location("Pune")
                .status(ProjectStatus.ACTIVE)
                .billSerialCounter(0)
                .user(mockUser)
                .build();

        BillItem mockItem = BillItem.builder()
                .id(1L)
                .itemName("Sand")
                .amount(new BigDecimal("10000"))
                .sortOrder(0)
                .build();

        mockBill = Bill.builder()
                .id(1L)
                .billNumber("PATEL-001")
                .billDate(LocalDate.now())
                .billPeriodStart(LocalDate.now().minusDays(7))
                .billPeriodEnd(LocalDate.now())
                .totalAmount(new BigDecimal("10000"))
                .project(mockProject)
                .createdBy(mockUser)
                .items(new ArrayList<>(List.of(mockItem)))
                .build();

        mockItem.setBill(mockBill);
    }

    // ==================== CREATE BILL TESTS ====================

    @Test
    @DisplayName("Create bill — success with single item")
    void createBill_success() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setItems(List.of(itemRequest));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);
        when(billRepository.save(any(Bill.class))).thenReturn(mockBill);

        BillResponse response = billService.createBill(mockUser.getEmail(), 1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getBillNumber()).isEqualTo("PATEL-001");
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("10000"));
        verify(billRepository).save(any(Bill.class));
    }

    @Test
    @DisplayName("Create bill — success with multiple items and correct total")
    void createBill_multipleItems_correctTotal() {
        BillItemRequest item1 = new BillItemRequest();
        item1.setItemName("Sand");
        item1.setAmount(new BigDecimal("10000"));

        BillItemRequest item2 = new BillItemRequest();
        item2.setItemName("Cement");
        item2.setAmount(new BigDecimal("15000"));

        BillItemRequest item3 = new BillItemRequest();
        item3.setItemName("Labour");
        item3.setAmount(new BigDecimal("8000"));

        BillRequest request = new BillRequest();
        request.setBillDate(LocalDate.now());
        request.setItems(List.of(item1, item2, item3));

        Bill billWithMultipleItems = Bill.builder()
                .id(1L)
                .billNumber("PATEL-001")
                .billDate(LocalDate.now())
                .totalAmount(new BigDecimal("33000"))
                .project(mockProject)
                .createdBy(mockUser)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);
        when(billRepository.save(any(Bill.class))).thenReturn(billWithMultipleItems);

        BillResponse response = billService.createBill(mockUser.getEmail(), 1L, request);

        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("33000"));
    }

    @Test
    @DisplayName("Create bill — bill date defaults to today when not provided")
    void createBill_defaultsBillDateToToday() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setBillDate(null);
        request.setItems(List.of(itemRequest));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> {
            Bill savedBill = invocation.getArgument(0);
            assertThat(savedBill.getBillDate()).isEqualTo(LocalDate.now());
            return mockBill;
        });

        billService.createBill(mockUser.getEmail(), 1L, request);

        verify(billRepository).save(any(Bill.class));
    }

    @Test
    @DisplayName("Create bill — serial counter increments on project")
    void createBill_serialCounterIncrements() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setItems(List.of(itemRequest));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project saved = invocation.getArgument(0);
            assertThat(saved.getBillSerialCounter()).isEqualTo(1);
            return saved;
        });
        when(billRepository.save(any(Bill.class))).thenReturn(mockBill);

        billService.createBill(mockUser.getEmail(), 1L, request);

        verify(projectRepository).save(any(Project.class));
    }

    @Test
    @DisplayName("Create bill — fail when user not found")
    void createBill_userNotFound_throwsException() {
        BillRequest request = new BillRequest();
        request.setItems(List.of(new BillItemRequest()));

        when(userRepository.findByEmail("ghost@siteledger.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billService.createBill("ghost@siteledger.com", 1L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");

        verify(billRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create bill — fail when project not found")
    void createBill_projectNotFound_throwsException() {
        BillRequest request = new BillRequest();
        request.setItems(List.of(new BillItemRequest()));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(99L, mockUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billService.createBill(mockUser.getEmail(), 99L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Project not found");

        verify(billRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create bill — fail when period start is after period end")
    void createBill_invalidPeriod_throwsException() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setBillPeriodStart(LocalDate.now());
        request.setBillPeriodEnd(LocalDate.now().minusDays(7));
        request.setItems(List.of(itemRequest));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));

        assertThatThrownBy(() -> billService.createBill(mockUser.getEmail(), 1L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bill period start date must be before end date");

        verify(billRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create bill — fail when duplicate period exists")
    void createBill_duplicatePeriod_throwsException() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setBillPeriodStart(LocalDate.now().minusDays(7));
        request.setBillPeriodEnd(LocalDate.now());
        request.setItems(List.of(itemRequest));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.existsByProjectIdAndBillPeriodStartAndBillPeriodEnd(
                1L, request.getBillPeriodStart(), request.getBillPeriodEnd()))
                .thenReturn(true);

        assertThatThrownBy(() -> billService.createBill(mockUser.getEmail(), 1L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("A bill already exists for this period");

        verify(billRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create bill — fail when period overlaps existing bill")
    void createBill_overlappingPeriod_throwsException() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("10000"));

        BillRequest request = new BillRequest();
        request.setBillPeriodStart(LocalDate.now().minusDays(3));
        request.setBillPeriodEnd(LocalDate.now().plusDays(3));
        request.setItems(List.of(itemRequest));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.existsByProjectIdAndBillPeriodStartAndBillPeriodEnd(
                anyLong(), any(), any())).thenReturn(false);
        when(billRepository.existsOverlappingBill(
                anyLong(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> billService.createBill(mockUser.getEmail(), 1L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bill period overlaps with an existing bill");

        verify(billRepository, never()).save(any());
    }

    // ==================== GET BILLS TESTS ====================

    @Test
    @DisplayName("Get bills by project — success without date filter")
    void getBillsByProject_noFilter_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Bill> billPage = new PageImpl<>(List.of(mockBill));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByProjectId(1L, pageable)).thenReturn(billPage);

        Page<BillResponse> response = billService.getBillsByProject(
                mockUser.getEmail(), 1L, null, null, pageable);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getBillNumber()).isEqualTo("PATEL-001");
    }

    @Test
    @DisplayName("Get bills by project — success with date filter")
    void getBillsByProject_withDateFilter_success() {
        Pageable pageable = PageRequest.of(0, 10);
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();
        Page<Bill> billPage = new PageImpl<>(List.of(mockBill));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByProjectIdAndBillDateBetween(1L, from, to, pageable))
                .thenReturn(billPage);

        Page<BillResponse> response = billService.getBillsByProject(
                mockUser.getEmail(), 1L, from, to, pageable);

        assertThat(response.getContent()).hasSize(1);
    }

    // ==================== GET BILL BY ID TESTS ====================

    @Test
    @DisplayName("Get bill by ID — success")
    void getBillById_success() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByIdAndProjectId(1L, 1L)).thenReturn(Optional.of(mockBill));

        BillResponse response = billService.getBillById(mockUser.getEmail(), 1L, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getBillNumber()).isEqualTo("PATEL-001");
        assertThat(response.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("Get bill by ID — fail when bill not found")
    void getBillById_notFound_throwsException() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByIdAndProjectId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billService.getBillById(mockUser.getEmail(), 1L, 99L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bill not found");
    }

    // ==================== UPDATE BILL TESTS ====================

    @Test
    @DisplayName("Update bill — success replaces items and recalculates total")
    void updateBill_success() {
        BillItemRequest newItem = new BillItemRequest();
        newItem.setItemName("Bricks");
        newItem.setAmount(new BigDecimal("20000"));

        BillRequest request = new BillRequest();
        request.setItems(List.of(newItem));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByIdAndProjectId(1L, 1L)).thenReturn(Optional.of(mockBill));
        when(billRepository.save(any(Bill.class))).thenReturn(mockBill);

        BillResponse response = billService.updateBill(mockUser.getEmail(), 1L, 1L, request);

        assertThat(response).isNotNull();
        verify(billRepository).save(any(Bill.class));
    }

    @Test
    @DisplayName("Update bill — fail when bill not found")
    void updateBill_notFound_throwsException() {
        BillRequest request = new BillRequest();
        request.setItems(List.of(new BillItemRequest()));

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByIdAndProjectId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billService.updateBill(mockUser.getEmail(), 1L, 99L, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bill not found");

        verify(billRepository, never()).save(any());
    }

    // ==================== DELETE BILL TESTS ====================

    @Test
    @DisplayName("Delete bill — success hard deletes bill and saves audit log")
    void deleteBill_success() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByIdAndProjectId(1L, 1L)).thenReturn(Optional.of(mockBill));

        billService.deleteBill(mockUser.getEmail(), 1L, 1L);

        verify(billAuditLogRepository).save(any(BillAuditLog.class));
        verify(billRepository).delete(mockBill);
    }

    @Test
    @DisplayName("Delete bill — fail when bill not found")
    void deleteBill_notFound_throwsException() {
        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(billRepository.findByIdAndProjectId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billService.deleteBill(mockUser.getEmail(), 1L, 99L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bill not found");

        verify(billAuditLogRepository, never()).save(any());
        verify(billRepository, never()).delete(any());
    }

    // ==================== BILL NUMBER GENERATION TESTS ====================

    @Test
    @DisplayName("Bill number — generated correctly from project name")
    void createBill_billNumberGeneratedCorrectly() {
        BillItemRequest itemRequest = new BillItemRequest();
        itemRequest.setItemName("Sand");
        itemRequest.setAmount(new BigDecimal("5000"));

        BillRequest request = new BillRequest();
        request.setItems(List.of(itemRequest));

        Bill expectedBill = Bill.builder()
                .id(1L)
                .billNumber("PATEL-001")
                .billDate(LocalDate.now())
                .totalAmount(new BigDecimal("5000"))
                .project(mockProject)
                .createdBy(mockUser)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(projectRepository.findByIdAndUserId(1L, mockUser.getId()))
                .thenReturn(Optional.of(mockProject));
        when(projectRepository.save(any())).thenReturn(mockProject);
        when(billRepository.save(any(Bill.class))).thenReturn(expectedBill);

        BillResponse response = billService.createBill(mockUser.getEmail(), 1L, request);

        assertThat(response.getBillNumber()).startsWith("PATEL");
        assertThat(response.getBillNumber()).contains("-001");
    }
}