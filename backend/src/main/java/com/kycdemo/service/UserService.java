package com.kycdemo.service;

import com.kycdemo.dto.UserDtos.*;
import com.kycdemo.model.User;
import com.kycdemo.model.User.KycStatus;
import com.kycdemo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Al iniciar la app, crea el usuario admin por defecto si no existe.
     * Credenciales configurables via variables de entorno.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initAdmin() {
        if (!userRepository.existsByEmail(adminUsername)) {
            User admin = new User();
            admin.setNombre("Admin");
            admin.setApellido("KYC");
            admin.setEmail(adminUsername);
            admin.setPassword(adminPassword);
            admin.setAdmin(true);
            admin.setKycStatus(KycStatus.APPROVED);
            userRepository.save(admin);
            log.info("👤 Usuario admin creado: {}", adminUsername);
        }
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }
        User user = new User();
        user.setNombre(req.getNombre());
        user.setApellido(req.getApellido());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword()); // producción: BCrypt
        user.setDni(req.getDni());
        user.setTelefono(req.getTelefono());
        user.setFechaNacimiento(req.getFechaNacimiento());
        user.setKycStatus(KycStatus.NOT_STARTED);
        user = userRepository.save(user);
        log.info("Usuario registrado: {} (id={})", user.getEmail(), user.getId());
        return toResponse(user);
    }

    public UserResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (!user.getPassword().equals(req.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }
        return toResponse(user);
    }

    public UserResponse getById(Long id) {
        return toResponse(findUser(id));
    }

    // --- Panel admin ---

    /** Lista todos los usuarios no-admin con un estado KYC específico */
    public List<UserResponse> getUsersByStatus(String status) {
        List<User> users = status == null || status.isBlank()
            ? userRepository.findByAdminFalse()
            : userRepository.findByKycStatusAndAdminFalse(KycStatus.valueOf(status));
        return users.stream().map(this::toResponse).toList();
    }

    // --- helpers ---

    public User findUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    public UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setNombre(u.getNombre());
        r.setApellido(u.getApellido());
        r.setEmail(u.getEmail());
        r.setDni(u.getDni());
        r.setKycStatus(u.getKycStatus().name());
        r.setKycRejectReason(u.getKycRejectReason());
        r.setKycAdminComment(u.getKycAdminComment());
        r.setAdmin(u.isAdmin());
        r.setHasDocFrente(u.getDocFrentePath() != null);
        r.setHasDocDorso(u.getDocDorsoPath() != null);
        r.setHasSelfie(u.getSelfiePath() != null);
        r.setKycSubmittedAt(u.getKycSubmittedAt() != null ? u.getKycSubmittedAt().toString() : null);
        r.setKycVerifiedAt(u.getKycVerifiedAt() != null ? u.getKycVerifiedAt().toString() : null);
        return r;
    }
}
