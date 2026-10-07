# TechStore — Tienda de computadores y accesorios

Backend **Java 21, Spring Boot 4.1.1, Gradle y PostgreSQL**, adaptado de la
plantilla `Plantilla_Spring_Security` (se conserva su seguridad: JWT con
`com.auth0:java-jwt`, rol por usuario, permisos, bootstrap de admin, CORS,
Swagger y manejo de errores). Los módulos clientes/productos/ventas se
reemplazaron por **Categoria, Articulo y Pedido**. El frontend está en
`Frontend/` (HTML/CSS/JS con `fetch`).

## Estructura

```
build.gradle, settings.gradle, gradlew.bat
database/techstore_db.sql
docs/PLANTILLA_MODULOS.md
Frontend/index.html (login + panel admin SPA)
Frontend/catalogo.html (catálogo público, sin login)
Frontend/app.js, Frontend/styles.css
src/main/java/com/roles/usermanagement/
  modules/categoria/ (entidad, request/response, repo, service, controller)
  modules/articulo/  (idem + ArticuloPublicDTO sin stockMinimo)
  modules/pedido/    (idem + CambioEstadoRequest)
  domain/ (seguridad: UserRoles con permisos CATEGORIA_* ARTICULO_* PEDIDO_*)
  persistance/ (User/Role/Permission, sin cambios)
  web/config/ (SecurityConfig: GET catálogo público, resto ADMIN)
  web/controller/ (AuthController, ApiExceptionHandler, sin cambios)
src/main/resources/application-dev.properties (DB techstore_db, puerto 8050)
src/test/ (11 tests, incluye flujo TechStore de stock y permisos)
```

## Cómo ejecutarlo

Requisitos: JDK 21 y PostgreSQL. No necesitas instalar Gradle (usa el Wrapper).

```powershell
psql -U postgres -f database/techstore_db.sql
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = '<tu clave>'
.\gradlew.bat bootRun
```

- API: http://localhost:8080 → **http://localhost:8050**
- Admin inicial: `superadmin` / `SuperAdmin123!` (perfil `dev`)
- Swagger: http://localhost:8050/swagger-ui.html
- Tests: `.\gradlew.bat test` (H2, 11 pruebas en verde)

## Endpoints (método, ruta, acceso)

| Método | Ruta | Acceso |
|---|---|---|
| POST | /api/auth/login | Público (devuelve JWT como texto) |
| GET | /api/auth/me | Autenticado |
| GET | /api/categorias, /api/categorias/{id} | Público |
| POST / PUT / DELETE | /api/categorias... | ADMIN (CATEGORIA_CREATE/UPDATE/DELETE) |
| GET | /api/articulos?categoriaId=&nombre=, /api/articulos/{id} | Público, sin stockMinimo |
| GET | /api/articulos/stock-bajo | ADMIN (ARTICULO_STOCK) |
| POST / PUT / DELETE | /api/articulos... | ADMIN (ARTICULO_CREATE/UPDATE/DELETE) |
| GET / POST | /api/pedidos?estado=, /api/pedidos, /api/pedidos/{id} | ADMIN (PEDIDO_READ/CREATE) |
| PATCH | /api/pedidos/{id}/estado | ADMIN (PEDIDO_STATUS) |
| ... | /api/user/**, /api/roles, /api/permissions | Seguridad de la plantilla |

Reglas: el pedido valida stock, copia el precio, calcula el total y descuenta;
CANCELADO devuelve stock; no se borra categoría con artículos.
