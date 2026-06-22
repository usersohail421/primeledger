package com.siteledger.excel.service;

import com.siteledger.exception.ApiException;
import com.siteledger.bill.model.Bill;
import com.siteledger.bill.model.BillItem;
import com.siteledger.project.model.Project;
import com.siteledger.auth.model.User;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.project.repository.ProjectRepository;
import com.siteledger.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final BillRepository billRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy");

    @Transactional(readOnly = true)
    public byte[] generateProjectExcel(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        Project project = projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ApiException("Project not found", HttpStatus.NOT_FOUND));

        List<Bill> bills = billRepository.findByProjectId(
                projectId,
                PageRequest.of(0, Integer.MAX_VALUE, Sort.by("billDate").ascending())
        ).getContent();

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Expenses");

            // Column widths
            sheet.setColumnWidth(0, 5000);
            sheet.setColumnWidth(1, 5000);
            sheet.setColumnWidth(2, 5000);
            sheet.setColumnWidth(3, 10000);
            sheet.setColumnWidth(4, 5000);
            sheet.setColumnWidth(5, 5000);

            // Styles
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle amountStyle = createAmountStyle(workbook);
            CellStyle totalLabelStyle = createTotalLabelStyle(workbook);
            CellStyle totalAmountStyle = createTotalAmountStyle(workbook);
            CellStyle billHeaderStyle = createBillHeaderStyle(workbook);

            int rowNum = 0;

            // Title row — Project name
            Row titleRow = sheet.createRow(rowNum++);
            titleRow.setHeightInPoints(24);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Project: " + project.getName());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // Company name row
            if (user.getCompanyName() != null) {
                Row companyRow = sheet.createRow(rowNum++);
                Cell companyCell = companyRow.createCell(0);
                companyCell.setCellValue(user.getCompanyName());
                companyCell.setCellStyle(createSubTitleStyle(workbook));
                sheet.addMergedRegion(new CellRangeAddress(rowNum - 1, rowNum - 1, 0, 5));
            }

            // Empty row
            rowNum++;

            // Column headers
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {
                    "Bill Number", "Bill Date", "Bill Period", "Item Name",
                    "Expense Date", "Amount (₹)"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            BigDecimal grandTotal = BigDecimal.ZERO;

            // Data rows
            for (Bill bill : bills) {
                // Bill header row
                Row billHeaderRow = sheet.createRow(rowNum++);
                Cell billHeaderCell = billHeaderRow.createCell(0);
                String billPeriod = "";
                if (bill.getBillPeriodStart() != null && bill.getBillPeriodEnd() != null) {
                    billPeriod = bill.getBillPeriodStart().format(DATE_FORMATTER)
                            + " - " + bill.getBillPeriodEnd().format(DATE_FORMATTER);
                }
                billHeaderCell.setCellValue(
                        bill.getBillNumber() + "  |  "
                                + bill.getBillDate().format(DATE_FORMATTER)
                                + (billPeriod.isEmpty() ? "" : "  |  Period: " + billPeriod)
                );
                billHeaderCell.setCellStyle(billHeaderStyle);
                sheet.addMergedRegion(new CellRangeAddress(rowNum - 1, rowNum - 1, 0, 5));

                // Item rows
                for (BillItem item : bill.getItems()) {
                    Row dataRow = sheet.createRow(rowNum++);

                    Cell billNumCell = dataRow.createCell(0);
                    billNumCell.setCellValue(bill.getBillNumber());
                    billNumCell.setCellStyle(dataStyle);

                    Cell billDateCell = dataRow.createCell(1);
                    billDateCell.setCellValue(bill.getBillDate().format(DATE_FORMATTER));
                    billDateCell.setCellStyle(dataStyle);

                    Cell periodCell = dataRow.createCell(2);
                    periodCell.setCellValue(billPeriod);
                    periodCell.setCellStyle(dataStyle);

                    Cell itemNameCell = dataRow.createCell(3);
                    itemNameCell.setCellValue(item.getItemName());
                    itemNameCell.setCellStyle(dataStyle);

                    Cell expenseDateCell = dataRow.createCell(4);
                    expenseDateCell.setCellValue(
                            item.getExpenseDate() != null
                                    ? item.getExpenseDate().format(DATE_FORMATTER) : "");
                    expenseDateCell.setCellStyle(dataStyle);

                    Cell amountCell = dataRow.createCell(5);
                    amountCell.setCellValue(item.getAmount().doubleValue());
                    amountCell.setCellStyle(amountStyle);

                    grandTotal = grandTotal.add(item.getAmount());
                }

                // Bill subtotal row
                Row subtotalRow = sheet.createRow(rowNum++);
                Cell subtotalLabelCell = subtotalRow.createCell(4);
                subtotalLabelCell.setCellValue("Bill Total:");
                subtotalLabelCell.setCellStyle(totalLabelStyle);

                Cell subtotalAmountCell = subtotalRow.createCell(5);
                subtotalAmountCell.setCellValue(bill.getTotalAmount().doubleValue());
                subtotalAmountCell.setCellStyle(totalAmountStyle);

                // Empty row after each bill
                rowNum++;
            }

            // Grand total row
            Row grandTotalRow = sheet.createRow(rowNum);
            grandTotalRow.setHeightInPoints(18);

            Cell grandTotalLabelCell = grandTotalRow.createCell(4);
            grandTotalLabelCell.setCellValue("Grand Total:");
            grandTotalLabelCell.setCellStyle(totalLabelStyle);

            Cell grandTotalAmountCell = grandTotalRow.createCell(5);
            grandTotalAmountCell.setCellValue(grandTotal.doubleValue());
            grandTotalAmountCell.setCellStyle(totalAmountStyle);

            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new ApiException("Failed to generate Excel: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createSubTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerFont.setFontHeightInPoints((short) 11);
        style.setFont(headerFont);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createAmountStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.RIGHT);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private CellStyle createTotalLabelStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createTotalAmountStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setBorderBottom(BorderStyle.DOUBLE);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.00"));
        return style;
    }

    private CellStyle createBillHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}