package com.kycdemo.controller;

import com.kycdemo.dto.UserDtos.*;
import com.kycdemo.model.User;
import com.kycdemo.service.KycService;
import com.kycdemo.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class KycController {

    private static final Logger log = LoggerFactory.getLogger(KycController.class);

    private final KycService kycService;
    private final UserService userService;

    public KycController(KycService kycService, UserService userService) {
        this.kycService = kycService;
        this.userService = userService;
    }

    // ─── ENDPOINTS DE USUARIO ────────────────────────────────────────────────

    /**
     * Usuario sube sus documentos KYC.
     * Acepta multipart/form-data con los tres archivos.
     * Cuando los tres están presentes, el estado pasa a PENDING automáticamente.
     */
    @PostMapping("/api/kyc/submit/{userId}")
    public ResponseEntity<?> submitDocuments(
            @PathVariable Long userId,
            @RequestParam(required = false) MultipartFile docFrente,
            @RequestParam(required = false) MultipartFile docDorso,
            @RequestParam(required = false) MultipartFile selfie) {
        try {
            kycService.submitDocuments(userId, docFrente, docDorso, selfie);
            UserResponse updated = userService.getById(userId);
            return ResponseEntity.ok(Map.of(
                "message", "Documentos recibidos correctamente",
                "user", updated
            ));
        } catch (Exception e) {
            log.error("Error al subir documentos para userId {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Polling del frontend: el usuario consulta su estado KYC periódicamente
     * para saber si el admin ya tomó una decisión.
     */
    @GetMapping("/api/kyc/status/{userId}")
    public ResponseEntity<?> getStatus(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(userService.getById(userId));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ─── ENDPOINTS DE ADMIN ──────────────────────────────────────────────────

    /**
     * Lista usuarios filtrados por estado KYC para el panel del admin.
     * ?status=PENDING | IN_REVIEW | APPROVED | DECLINED | (vacío = todos)
     *
     * En producción: proteger con JWT/roles. Aquí simplificado para el demo.
     */
    @GetMapping("/api/admin/kyc/users")
    public ResponseEntity<List<UserResponse>> listUsers(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }

    /**
     * El admin aprueba o rechaza el KYC de un usuario.
     * Este endpoint reemplaza exactamente lo que antes hacía el webhook de Sumsub.
     *
     * Body: { "decision": "APPROVED" | "DECLINED" | "IN_REVIEW",
     *         "rejectReason": "UNDERAGE_PERSON | SANCTIONS | FRAUD | DATA_MISMATCH | DOCUMENT_EXPIRED",
     *         "adminComment": "comentario libre" }
     */
    @PostMapping("/api/admin/kyc/decide/{userId}")
    public ResponseEntity<?> decide(
            @PathVariable Long userId,
            @Valid @RequestBody KycDecisionRequest req) {
        try {
            kycService.processDecision(userId, req.getDecision(),
                req.getRejectReason(), req.getAdminComment());
            return ResponseEntity.ok(Map.of(
                "message", "Decisión aplicada: " + req.getDecision(),
                "user", userService.getById(userId)
            ));
        } catch (Exception e) {
            log.error("Error al procesar decisión para userId {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * El admin puede ver los documentos del usuario para revisarlos.
     * Sirve la imagen directamente desde disco.
     * tipo: frente | dorso | selfie
     */
    @GetMapping("/api/admin/kyc/document/{userId}/{tipo}")
    public ResponseEntity<Resource> getDocument(
            @PathVariable Long userId,
            @PathVariable String tipo) {
        try {
            Path filePath = kycService.getDocumentPath(userId, tipo);
            Resource resource = new PathResource(filePath);
            // Detectar content-type básico por extensión
            String filename = filePath.getFileName().toString().toLowerCase();
            MediaType mediaType = filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok().contentType(mediaType).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
