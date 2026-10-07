package com.roles.usermanagement.modules.articulo;

import com.roles.usermanagement.modules.categoria.Categoria;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

// Articulo de la tienda (ej: portatil). N articulos -> 1 categoria
@Entity
@Table(name = "articulo")
@Getter
@Setter
public class Articulo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SKU unico
    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 100)
    private String marca;

    @Column(length = 100)
    private String modelo;

    @Column(columnDefinition = "TEXT")
    private String especificaciones;

    // Precio mayor a 0
    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    // Stock no negativo
    @Column(name = "stock_actual", nullable = false)
    private Integer stockActual = 0;

    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo = 5;

    @Column(name = "fecha_ingreso")
    private LocalDate fechaIngreso;

    // Muchos articulos -> una categoria
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;
}
