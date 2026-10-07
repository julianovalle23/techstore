package com.roles.usermanagement.modules.categoria;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// GET publico (catalogo), resto solo ADMIN
@RestController
@RequestMapping("/api/categorias")
@Tag(name = "Categorias")
public class CategoriaController {

    private final CategoriaService service;

    public CategoriaController(CategoriaService service) {
        this.service = service;
    }

    @Operation(summary = "Listar categorias (publico)")
    @GetMapping
    public List<CategoriaResponse> all() {
        return service.all();
    }

    @Operation(summary = "Ver una categoria (publico)")
    @GetMapping("/{id}")
    public CategoriaResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Crear categoria (ADMIN)")
    @PostMapping
    @PreAuthorize("hasAuthority('CATEGORIA_CREATE')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<CategoriaResponse> create(@Valid @RequestBody CategoriaRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Editar categoria (ADMIN)")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CATEGORIA_UPDATE')")
    @SecurityRequirement(name = "bearerAuth")
    public CategoriaResponse update(@PathVariable Long id, @Valid @RequestBody CategoriaRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Eliminar categoria (ADMIN, sin articulos)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CATEGORIA_DELETE')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
