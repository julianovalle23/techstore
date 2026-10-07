package com.roles.usermanagement.modules.pedido;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// Solo para cambiar el estado del pedido
public record CambioEstadoRequest(
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(regexp = "PAGADO|PENDIENTE|CANCELADO", message = "Estado no valido")
        String estado
) {}
