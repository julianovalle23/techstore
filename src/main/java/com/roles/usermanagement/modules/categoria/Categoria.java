package com.roles.usermanagement.modules.categoria;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Categoria de articulos (ej: Portatiles). 1 categoria -> N articulos
@Entity
@Table(name = "categoria")
@Getter
@Setter
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Obligatorio y unico
    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    // Solo activa o inactiva
    @Column(nullable = false, length = 10)
    private String estado = "activa";
}
