package com.roles.usermanagement.modules.pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Dato que devuelve la API
public record PedidoResponse(
        Long id, LocalDateTime fecha,
        String compradorNombre, String compradorDocumento,
        String compradorCorreo, String compradorTelefono,
        Long articuloId, String articuloNombre,
        Integer cantidad, BigDecimal precioUnitario, BigDecimal total,
        String metodoPago, String estado
) {}
