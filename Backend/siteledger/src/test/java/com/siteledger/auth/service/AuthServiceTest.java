package com.siteledger.auth.service;

import com.siteledger.auth.dto.request.LoginRequest;
import com.siteledger.auth.dto.request.RegisterRequest;
import com.siteledger.auth.dto.request.UpdateProfileRequest;
import com.siteledger.auth.dto.response.AuthResponse;
import com.siteledger.auth.dto.response.UserProfileResponse;
import com.siteledger.auth.model.User;
import com.siteledger.auth.repository.UserRepository;
import com.siteledger.exception.ApiException;
import com.siteledger.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private User mockUser;
    private UserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .name("Sohail Shaikh")
                .email("sohail@siteledger.com")
                .password("encodedPassword123")
                .build();

        mockUserDetails = org.springframework.security.core.userdetails.User
                .withUsername(mockUser.getEmail())
                .password(mockUser.getPassword())
                .authorities("ROLE_USER")
                .build();
    }

    // ==================== REGISTER TESTS ====================

    @Test
    @DisplayName("Register — success with valid details")
    void register_success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(userDetailsService.loadUserByUsername(request.getEmail())).thenReturn(mockUserDetails);
        when(jwtService.generateToken(mockUserDetails)).thenReturn("mockJwtToken");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mockJwtToken");
        assertThat(response.getEmail()).isEqualTo("sohail@siteledger.com");
        assertThat(response.getName()).isEqualTo("Sohail Shaikh");

        verify(userRepository).existsByEmail(request.getEmail());
        verify(passwordEncoder).encode(request.getPassword());
        verify(userRepository).save(any(User.class));
        verify(jwtService).generateToken(mockUserDetails);
    }

    @Test
    @DisplayName("Register — fail when email already exists")
    void register_emailAlreadyExists_throwsException() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sohail Shaikh");
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any(User.class));
        verify(jwtService, never()).generateToken(any());
    }

    // ==================== LOGIN TESTS ====================

    @Test
    @DisplayName("Login — success with correct credentials")
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("sohail@siteledger.com");
        request.setPassword("password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(mockUser));
        when(userDetailsService.loadUserByUsername(request.getEmail())).thenReturn(mockUserDetails);
        when(jwtService.generateToken(mockUserDetails)).thenReturn("mockJwtToken");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mockJwtToken");
        assertThat(response.getEmail()).isEqualTo("sohail@siteledger.com");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(mockUserDetails);
    }

    @Test
    @DisplayName("Login — fail with wrong credentials")
    void login_wrongCredentials_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("sohail@siteledger.com");
        request.setPassword("wrongpassword");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(any());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Login — fail when user not found in DB")
    void login_userNotFound_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("notexist@siteledger.com");
        request.setPassword("password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");
    }

    // ==================== GET PROFILE TESTS ====================

    @Test
    @DisplayName("Get profile — success")
    void getProfile_success() {
        mockUser.setPhone("9876543210");
        mockUser.setCompanyName("Shaikh Constructions");
        mockUser.setOfficeAddress("Pune, Maharashtra");

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));

        UserProfileResponse response = authService.getProfile(mockUser.getEmail());

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("sohail@siteledger.com");
        assertThat(response.getName()).isEqualTo("Sohail Shaikh");
        assertThat(response.getCompanyName()).isEqualTo("Shaikh Constructions");
    }

    @Test
    @DisplayName("Get profile — fail when user not found")
    void getProfile_userNotFound_throwsException() {
        when(userRepository.findByEmail("ghost@siteledger.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getProfile("ghost@siteledger.com"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");
    }

    // ==================== UPDATE PROFILE TESTS ====================

    @Test
    @DisplayName("Update profile — success with partial fields")
    void updateProfile_success() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setCompanyName("New Company Name");
        request.setPhone("9999999999");

        when(userRepository.findByEmail(mockUser.getEmail())).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserProfileResponse response = authService.updateProfile(mockUser.getEmail(), request);

        assertThat(response).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Update profile — fail when user not found")
    void updateProfile_userNotFound_throwsException() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setCompanyName("Some Company");

        when(userRepository.findByEmail("ghost@siteledger.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.updateProfile("ghost@siteledger.com", request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, never()).save(any());
    }
}