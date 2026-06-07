# KYC Demo — Flujo propio sin dependencias externas

Mini proyecto para entender e implementar un flujo KYC completo.
Stack: Spring Boot + PostgreSQL + React + Docker Compose.

## Cómo levantar

```bash
# 1. Cloná/copiá el proyecto y entrá al directorio
cd kyc-demo

# 2. Copiá el .env (podés dejar los valores por defecto)
cp .env.example .env

# 3. Levantá todo
docker compose up --build

# 4. Accedé
#    Frontend (usuario):  http://localhost:3000
#    Backend API:         http://localhost:18080
```

Si ya tenés PostgreSQL o alguna API corriendo localmente, Docker no puede publicar otro contenedor en esos mismos puertos. Por defecto este proyecto expone PostgreSQL en `localhost:5433`, el backend en `localhost:18080` y el frontend en `localhost:3000`. Si necesitás cambiarlos, editá `POSTGRES_HOST_PORT`, `BACKEND_HOST_PORT` o `FRONTEND_HOST_PORT` en `.env`.

## Usuarios por defecto

| Rol   | Email  | Password  |
|-------|--------|-----------|
| Admin | admin@admin.com  | admin123  |

El admin se crea automáticamente al iniciar el backend.
Podés cambiarlo en el .env antes de levantar:
  ADMIN_USERNAME=miemail@ejemplo.com
  ADMIN_PASSWORD=mipassword

## Flujo completo para probar

### Como usuario:
1. Ir a http://localhost:3000/register
2. Completar el formulario de registro
3. En el dashboard, clic en "Iniciar verificación"
4. Subir 3 imágenes (cualquier foto de prueba): DNI frente, DNI dorso, selfie
5. Enviar → el estado pasa a "En revisión"
6. Esperar a que el admin tome una decisión (polling automático cada 6s)

### Como admin:
1. Ir a http://localhost:3000/login
2. Usar credenciales admin (admin@admin.com / admin123)
3. En el dashboard, clic en "Panel Admin"
4. Ver usuarios con estado PENDING
5. Expandir un usuario → ver sus documentos
6. Elegir: Aprobar / Rechazar (con razón) / Marcar en revisión
7. El usuario verá el cambio en su dashboard automáticamente

## Razones de rechazo disponibles

- UNDERAGE_PERSON       → Menor de edad
- SANCTIONS             → Persona en lista de sanciones
- FRAUD                 → Patrones fraudulentos
- DATA_MISMATCH         → Datos no coinciden con el documento
- DOCUMENT_EXPIRED      → Documento vencido
- DOCUMENT_UNREADABLE   → Documento ilegible

## Estructura del proyecto

```
kyc-demo/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── src/main/java/com/kycdemo/
│   │   ├── model/User.java          ← Entidad con kycStatus, rutas de docs
│   │   ├── service/KycService.java  ← Lógica: subida de docs + decisión admin
│   │   ├── service/UserService.java ← Registro, login, listado admin
│   │   ├── controller/KycController.java   ← /api/kyc/** y /api/admin/kyc/**
│   │   └── controller/AuthController.java  ← /api/auth/**
│   └── src/main/resources/application.yml
└── frontend/
    └── src/
        ├── pages/LoginPage.jsx
        ├── pages/RegisterPage.jsx
        ├── pages/DashboardPage.jsx  ← Muestra estado KYC con polling
        ├── pages/KycPage.jsx        ← Formulario de carga de documentos
        └── pages/AdminPage.jsx      ← Panel de revisión del admin

## Equivalencia con producción (Sumsub)

| Demo propio                     | Producción con Sumsub              |
|---------------------------------|------------------------------------|
| Admin revisa documentos         | IA + revisores humanos de Sumsub   |
| Botón "Aprobar/Rechazar"        | Webhook applicantReviewed          |
| Polling cada 6s                 | WebSocket o polling igual          |
| Archivos en disco local         | Almacenamiento encriptado Sumsub   |
| Sin liveness check              | Liveness check con IA              |

La arquitectura y los estados son idénticos. Solo cambia quién procesa.
