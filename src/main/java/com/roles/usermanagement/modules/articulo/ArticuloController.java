package com.roles.usermanagement.modules.articulo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// GET publico (sin stockMinimo), resto solo ADMIN
@RestController
@RequestMapping("/api/articulos")
@Tag(name = "Articulos")
public class ArticuloController {

    private final ArticuloService service;

    public ArticuloController(ArticuloService service) {
        this.service = service;
    }

    @Operation(summary = "Catalogo publico (filtros ?categoriaId= &nombre=)")
    @GetMapping
    public List<ArticuloPublicDTO> all(
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) String nombre) {
        return service.all(categoriaId, nombre);
    }

    @Operation(summary = "Alerta reposicion: stock <= minimo (ADMIN)")
    @GetMapping("/stock-bajo")
    @PreAuthorize("hasAuthority('ARTICULO_STOCK')")
    @SecurityRequirement(name = "bearerAuth")
    public List<ArticuloResponse> stockBajo() {
        return service.stockBajo();
    }

    @Operation(summary = "Detalle de articulo (publico)")
    @GetMapping("/{id}")
    public ArticuloPublicDTO get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Crear articulo (ADMIN)")
    @PostMapping
    @PreAuthorize("hasAuthority('ARTICULO_CREATE')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ArticuloResponse> create(@Valid @RequestBody ArticuloRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Editar articulo (ADMIN)")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ARTICULO_UPDATE')")
    @SecurityRequirement(name = "bearerAuth")
    public ArticuloResponse update(@PathVariable Long id, @Valid @RequestBody ArticuloRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Eliminar articulo (ADMIN)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ARTICULO_DELETE')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
