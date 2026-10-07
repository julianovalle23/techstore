# TechStore: categorías, artículos y pedidos protegidos

Los módulos están en `modules/categoria`, `modules/articulo` y `modules/pedido`.
Cada módulo separa entidad, repositorio, DTO de entrada, DTO de respuesta,
servicio transaccional y controlador REST. Reutilizan JWT, roles, permisos,
catálogo y manejo de errores de la seguridad de la plantilla.

## Ejecución

1. Crea la base: `psql -U postgres -f database/techstore_db.sql`
2. Arranca: `.\gradlew.bat bootRun` (perfil `dev`, puerto 8050)
3. Hibernate crea las tablas que falten. El bootstrap crea el admin
   (`superadmin` / `SuperAdmin123!`) y da todos los permisos a ADMIN.
4. Frontend: abre `Frontend/catalogo.html` (público) o `Frontend/index.html`
   (login admin, URL de API `http://localhost:8050`).
5. Swagger: http://localhost:8050/swagger-ui.html

## Permisos y rutas

| Módulo | Rutas | Permiso / acceso |
| --- | --- | --- |
| Categorías | GET /api/categorias y /{id} | Público |
| Categorías | POST /api/categorias | CATEGORIA_CREATE |
| Categorías | PUT /api/categorias/{id} | CATEGORIA_UPDATE |
| Categorías | DELETE /api/categorias/{id} | CATEGORIA_DELETE |
| Artículos | GET /api/articulos (?categoriaId=, ?nombre=) y /{id} | Público (sin stockMinimo) |
| Artículos | GET /api/articulos/stock-bajo | ARTICULO_STOCK |
| Artículos | POST /api/articulos | ARTICULO_CREATE |
| Artículos | PUT /api/articulos/{id} | ARTICULO_UPDATE |
| Artículos | DELETE /api/articulos/{id} | ARTICULO_DELETE |
| Pedidos | GET /api/pedidos (?estado=) y /{id} | PEDIDO_READ |
| Pedidos | POST /api/pedidos | PEDIDO_CREATE |
| Pedidos | PATCH /api/pedidos/{id}/estado | PEDIDO_STATUS |

## Reglas de negocio

- Crear pedido valida stock, copia el precio del artículo, calcula
  `total = cantidad × precio` y descuenta (con bloqueo pesimista).
- Pasar a CANCELADO devuelve las unidades; reactivar descuenta de nuevo.
- No se borra una categoría que tenga artículos.
- Listas simples (sin paginación); filtro por estado en pedidos.
