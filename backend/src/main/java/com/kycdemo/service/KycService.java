package com.kycdemo.service;

import com.kycdemo.model.User;
import com.kycdemo.model.User.KycStatus;
import com.kycdemo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Servicio de KYC propio — sin dependencia de Sumsub ni ningún proveedor externo.
 *
 * Responsabilidades:
 *  1. Recibir y almacenar los documentos del usuario (DNI frente, dorso, selfie)
 *  2. Marcar al usuario como PENDING una vez que subió todo
 *  3. Permitir al admin aprobar o rechazar con una razón específica
 *  4. Al aprobar/rechazar, actualizar el estado del usuario automáticamente
 *     (mismo efecto que antes producía el webhook de Sumsub)
 */
@Service
public class KycService {

    private static final Logger log = LoggerFactory.getLogger(KycService.class);

    @Value("${kyc.upload-dir:/app/uploads}")
    private String uploadDir;

    private final UserRepository userRepository;

    public KycService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Guarda los documentos del usuario en disco y lo pone en estado PENDING.
     * El admin verá este usuario en su cola de revisión.
     */
    @Transactional
    public void submitDocuments(Long userId,
                                MultipartFile docFrente,
                                MultipartFile docDorso,
                                MultipartFile selfie) throws IOException {
        User user = findUser(userId);

        // No permitir re-envío si ya fue aprobado
        if (KycStatus.APPROVED.equals(user.getKycStatus())) {
            throw new IllegalStateException("El usuario ya tiene KYC aprobado");
        }

        Path userDir = Paths.get(uploadDir, String.valueOf(userId));
        Files.createDirectories(userDir);

        if (docFrente != null && !docFrente.isEmpty()) {
            String path = saveFile(userDir, "frente", docFrente);
            user.setDocFrentePath(path);
        }
        if (docDorso != null && !docDorso.isEmpty()) {
            String path = saveFile(userDir, "dorso", docDorso);
            user.setDocDorsoPath(path);
        }
        if (selfie != null && !selfie.isEmpty()) {
            String path = saveFile(userDir, "selfie", selfie);
            user.setSelfiePath(path);
        }

        // Solo pasar a PENDING si subió los tres documentos
        boolean completo = user.getDocFrentePath() != null
                        && user.getDocDorsoPath() != null
                        && user.getSelfiePath() != null;

        if (completo) {
            user.setKycStatus(KycStatus.PENDING);
            user.setKycSubmittedAt(LocalDateTime.now());
            log.info("✅ Usuario {} (id={}) envió todos sus documentos → PENDING", user.getEmail(), userId);
        } else {
            log.info("📄 Usuario {} subió documentos parciales. Faltan: frente={} dorso={} selfie={}",
                user.getEmail(),
                user.getDocFrentePath() == null ? "NO" : "ok",
                user.getDocDorsoPath() == null ? "NO" : "ok",
                user.getSelfiePath() == null ? "NO" : "ok");
        }

        userRepository.save(user);
    }

    /**
     * El admin toma una decisión sobre el KYC de un usuario.
     *
     * Este método es el equivalente exacto del webhook de Sumsub:
     * cuando Sumsub mandaba GREEN/RED, ahora es el admin quien
     * dispara la misma lógica manualmente desde el panel.
     *
     * En producción real, este paso sería automático (Sumsub/Persona/etc.).
     * Para el demo académico, el admin es el "revisor humano".
     */
    @Transactional
    public void processDecision(Long userId, String decision,
                                String rejectReason, String adminComment) {
        User user = findUser(userId);

        log.info("Admin toma decisión sobre usuario {} (id={}): {}", user.getEmail(), userId, decision);

        switch (decision) {
            case "APPROVED" -> {
                user.setKycStatus(KycStatus.APPROVED);
                user.setKycVerifiedAt(LocalDateTime.now());
                user.setKycRejectReason(null);
                user.setKycAdminComment(adminComment);
                log.info("✅ Usuario {} APROBADO en KYC", user.getEmail());
            }
            case "IN_REVIEW" -> {
                // Admin marcó que está revisando activamente
                user.setKycStatus(KycStatus.IN_REVIEW);
                user.setKycAdminComment(adminComment);
                log.info("🔍 Usuario {} marcado como EN REVISIÓN", user.getEmail());
            }
            case "DECLINED" -> {
                user.setKycStatus(KycStatus.DECLINED);
                user.setKycRejectReason(rejectReason);
                user.setKycAdminComment(adminComment);
                log.info("❌ Usuario {} RECHAZADO. Razón: {}", user.getEmail(), rejectReason);
            }
            default -> throw new IllegalArgumentException("Decisión inválida: " + decision);
        }

        userRepository.save(user);
    }

    /**
     * Devuelve la ruta en disco de un documento para que el backend
     * pueda servirlo al admin como imagen.
     */
    public Path getDocumentPath(Long userId, String tipo) {
        User user = findUser(userId);
        String pathStr = switch (tipo) {
            case "frente" -> user.getDocFrentePath();
            case "dorso"  -> user.getDocDorsoPath();
            case "selfie" -> user.getSelfiePath();
            default -> throw new IllegalArgumentException("Tipo de documento inválido: " + tipo);
        };
        if (pathStr == null) {
            throw new IllegalStateException("El usuario no tiene ese documento subido");
        }
        return Paths.get(pathStr);
    }

    // --- helpers ---

    private String saveFile(Path dir, String prefix, MultipartFile file) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String filename = prefix + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
        Path dest = dir.resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        log.debug("Archivo guardado: {}", dest);
        return dest.toString();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }
}
