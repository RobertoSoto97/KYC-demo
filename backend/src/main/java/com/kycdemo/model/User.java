package com.kycdemo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String dni;
    private String telefono;
    private String fechaNacimiento;

    // Rutas de los archivos subidos por el usuario durante el KYC
    @Column(name = "doc_frente_path")
    private String docFrentePath;

    @Column(name = "doc_dorso_path")
    private String docDorsoPath;

    @Column(name = "selfie_path")
    private String selfiePath;

    // Estado del proceso KYC
    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false)
    private KycStatus kycStatus = KycStatus.NOT_STARTED;

    // Razón de rechazo (la elige el admin)
    @Column(name = "kyc_reject_reason")
    private String kycRejectReason;

    // Comentario adicional del admin al rechazar
    @Column(name = "kyc_admin_comment")
    private String kycAdminComment;

    @Column(name = "kyc_verified_at")
    private LocalDateTime kycVerifiedAt;

    @Column(name = "kyc_submitted_at")
    private LocalDateTime kycSubmittedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // true = es administrador de la plataforma
    @Column(name = "is_admin", nullable = false)
    private boolean admin = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum KycStatus {
        NOT_STARTED,  // Nunca inició
        PENDING,      // Subió documentos, esperando revisión del admin
        IN_REVIEW,    // Admin está revisando activamente
        APPROVED,     // Aprobado — puede operar
        DECLINED      // Rechazado (ver kycRejectReason)
    }
}
