package com.roles.usermanagement.modules.articulo;

import java.math.BigDecimal;
import java.time.LocalDate;

// Respuesta completa (ADMIN: incluye stockMinimo)
public record ArticuloResponse(
        Long id, String codigo, String nombre, String marca, String modelo,
        String especificaciones, BigDecimal precioUnitario,
        Integer stockActual, Integer stockMinimo, LocalDate fechaIngreso,
        Long categoriaId, String categoriaNombre
) {}
