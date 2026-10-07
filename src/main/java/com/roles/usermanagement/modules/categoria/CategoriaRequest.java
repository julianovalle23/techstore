package com.roles.usermanagement.modules.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Datos para crear/editar una categoria
public record CategoriaRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100)
        String nombre,

        @Size(max = 255)
        String descripcion,

        @Pattern(regexp = "activa|inactiva", message = "Estado debe ser activa o inactiva")
        String estado
) {}
