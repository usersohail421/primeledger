package com.siteledger.pdf;

import com.siteledger.exception.ApiException;
import com.siteledger.bill.model.Bill;
import com.siteledger.auth.model.User;
import com.siteledger.bill.repository.BillRepository;
import com.siteledger.project.repository.ProjectRepository;
import com.siteledger.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final BillRepository billRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TemplateEngine templateEngine;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy");

    private String getLogoAsBase64() {
        try {
            InputStream inputStream = getClass()
                    .getResourceAsStream("/static/images/Prime-Logo.png");
                if (inputStream == null) return null;
            byte[] bytes = inputStream.readAllBytes();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateBillPdf(String email, Long projectId, Long billId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ApiException("Project not found", HttpStatus.NOT_FOUND));

        Bill bill = billRepository.findByIdAndProjectId(billId, projectId)
                .orElseThrow(() -> new ApiException("Bill not found", HttpStatus.NOT_FOUND));

        Context context = new Context();
        context.setVariable("billDate",
                bill.getBillDate().format(DATE_FORMATTER));
        context.setVariable("billNumber",
                bill.getBillNumber());
        context.setVariable("projectName",
                bill.getProject().getName());
        context.setVariable("billPeriodStart",
                bill.getBillPeriodStart() != null
                        ? bill.getBillPeriodStart().format(DATE_FORMATTER) : null);
        context.setVariable("billPeriodEnd",
                bill.getBillPeriodEnd() != null
                        ? bill.getBillPeriodEnd().format(DATE_FORMATTER) : null);
        context.setVariable("items",
                bill.getItems());
        context.setVariable("totalAmount",
                bill.getTotalAmount());
        context.setVariable("companyName",
                user.getCompanyName() != null ? user.getCompanyName() : "Company Logo");
        context.setVariable("logoUrl", getLogoAsBase64());
        context.setVariable("officeAddress",
                user.getOfficeAddress());

        String htmlContent = templateEngine.process("bill-pdf", context);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new ApiException("Failed to generate PDF: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}