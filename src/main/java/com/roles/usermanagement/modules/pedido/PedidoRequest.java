package com.roles.usermanagement.modules.pedido;

import jakarta.validation.constraints.*;

// Datos que envia el admin al registrar un pedido
public record PedidoRequest(
        @NotBlank(message = "El nombre del comprador es obligatorio")
        String compradorNombre,

        String compradorDocumento,

        @Email(message = "Correo no valido")
        String compradorCorreo,

        String compradorTelefono,

        @NotNull(message = "El articulo es obligatorio")
        Long articuloId,

        @NotNull(message = "La cantidad es obligatoria")
        @Min(value = 1, message = "La cantidad debe ser mayor a 0")
        Integer cantidad,

        @NotBlank(message = "El metodo de pago es obligatorio")
        @Pattern(regexp = "efectivo|tarjeta|transferencia", message = "Pago no valido")
        String metodoPago
) {}
