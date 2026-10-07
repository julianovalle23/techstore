package com.roles.usermanagement.modules.pedido;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Todo protegido: solo ADMIN con JWT
@RestController
@RequestMapping("/api/pedidos")
@Tag(name = "Pedidos")
@SecurityRequirement(name = "bearerAuth")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @Operation(summary = "Registrar pedido (ADMIN, descuenta stock)")
    @PostMapping
    @PreAuthorize("hasAuthority('PEDIDO_CREATE')")
    public ResponseEntity<PedidoResponse> create(@Valid @RequestBody PedidoRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Listar pedidos, filtro ?estado= (ADMIN)")
    @GetMapping
    @PreAuthorize("hasAuthority('PEDIDO_READ')")
    public List<PedidoResponse> all(@RequestParam(required = false) String estado) {
        return service.all(estado);
    }

    @Operation(summary = "Ver un pedido (ADMIN)")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PEDIDO_READ')")
    public PedidoResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Cambiar estado; CANCELADO devuelve stock (ADMIN)")
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('PEDIDO_STATUS')")
    public PedidoResponse estado(@PathVariable Long id, @Valid @RequestBody CambioEstadoRequest dto) {
        return service.cambiarEstado(id, dto.estado());
    }
}
