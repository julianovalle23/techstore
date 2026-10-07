package com.roles.usermanagement.modules.articulo;

import java.math.BigDecimal;
import java.time.LocalDate;

// Vista publica del catalogo: SIN stockMinimo
public record ArticuloPublicDTO(
        Long id, String codigo, String nombre, String marca, String modelo,
        String especificaciones, BigDecimal precioUnitario,
        Integer stockActual, LocalDate fechaIngreso,
        Long categoriaId, String categoriaNombre
) {}
