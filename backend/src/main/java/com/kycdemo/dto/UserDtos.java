package com.kycdemo.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank private String nombre;
        @NotBlank private String apellido;
        @Email @NotBlank private String email;
        @NotBlank private String password;
        private String dni;
        private String telefono;
        private String fechaNacimiento;
    }

    @Data
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }

    @Data
    public static class UserResponse {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String dni;
        private String kycStatus;
        private String kycRejectReason;
        private String kycAdminComment;
        private boolean admin;
        private boolean hasDocFrente;
        private boolean hasDocDorso;
        private boolean hasSelfie;
        private String kycSubmittedAt;
        private String kycVerifiedAt;
    }

    // Payload que manda el admin al aprobar o rechazar
    @Data
    public static class KycDecisionRequest {
        @NotBlank private String decision;   // "APPROVED" o "DECLINED"
        private String rejectReason;         // Solo si DECLINED
        private String adminComment;         // Comentario libre opcional
    }

    // Para crear el admin por defecto desde el endpoint de setup
    @Data
    public static class AdminLoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }
}
