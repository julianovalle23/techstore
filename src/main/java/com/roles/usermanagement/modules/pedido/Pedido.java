package com.roles.usermanagement.modules.pedido;

import com.roles.usermanagement.modules.articulo.Articulo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// Pedido de un cliente (un articulo x cantidad). N pedidos -> 1 articulo
@Entity
@Table(name = "pedido")
@Getter
@Setter
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "comprador_nombre", nullable = false, length = 150)
    private String compradorNombre;

    @Column(name = "comprador_documento", length = 50)
    private String compradorDocumento;

    @Column(name = "comprador_correo", length = 150)
    private String compradorCorreo;

    @Column(name = "comprador_telefono", length = 50)
    private String compradorTelefono;

    // Muchos pedidos -> un articulo
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "articulo_id", nullable = false)
    private Articulo articulo;

    @Column(nullable = false)
    private Integer cantidad;

    // Copia del precio al vender (la pone el backend)
    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    // cantidad x precio (la pone el backend)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE";
}
