package com.siteledger.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siteledger.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitConfig rateLimitConfig;
    private final ObjectMapper objectMapper;

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();
        String method = request.getMethod();
        String ip = getClientIp(request);

        Bucket bucket = resolveBucket(uri, method, ip);

        if (bucket == null) {
            filterChain.doFilter(request, response);
            return;
        }

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining",
                    String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.addHeader("X-Rate-Limit-Retry-After-Seconds",
                    String.valueOf(waitSeconds));
            sendTooManyRequestsResponse(response, waitSeconds);
        }
    }

    private Bucket resolveBucket(String uri, String method, String ip) {

        if ("POST".equals(method) && uri.equals("/api/auth/login")) {
            return rateLimitConfig.getLoginBucket(ip);
        }

        if ("POST".equals(method) && uri.equals("/api/auth/register")) {
            return rateLimitConfig.getRegisterBucket(ip);
        }

        if ("GET".equals(method) && uri.matches("/api/projects/\\d+/bills/\\d+/pdf")) {
            return rateLimitConfig.getPdfBucket(getUserKey(ip));
        }

        if ("GET".equals(method) && uri.matches("/api/projects/\\d+/export/excel")) {
            return rateLimitConfig.getExcelBucket(getUserKey(ip));
        }

        if (uri.startsWith("/api/")
                && !uri.equals("/api/auth/login")
                && !uri.equals("/api/auth/register")
                && !uri.equals("/api/auth/test")) {
            return rateLimitConfig.getGeneralBucket(getUserKey(ip));
        }

        return null;
    }

    private String getUserKey(String ip) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return ip;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private void sendTooManyRequestsResponse(HttpServletResponse response, long waitSeconds)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new HashMap<>();
        body.put("status", 429);
        body.put("error", "Too many requests. Please try again in "
                + waitSeconds + " seconds.");
        body.put("timestamp", LocalDateTime.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}