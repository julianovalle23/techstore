package com.roles.usermanagement.modules.articulo;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

// Datos para crear/editar un articulo
public record ArticuloRequest(
        @NotBlank(message = "El codigo es obligatorio")
        @Size(max = 50)
        String codigo,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 150)
        String nombre,

        String marca,
        String modelo,
        String especificaciones,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
        @Digits(integer = 10, fraction = 2)
        BigDecimal precioUnitario,

        @Min(value = 0, message = "El stock no puede ser negativo")
        Integer stockActual,

        @Min(value = 0, message = "El stock minimo no puede ser negativo")
        Integer stockMinimo,

        @NotNull(message = "La categoria es obligatoria")
        Long categoriaId
) {}
