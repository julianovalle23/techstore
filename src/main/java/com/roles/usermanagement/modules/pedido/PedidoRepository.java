package com.roles.usermanagement.modules.pedido;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// Crear, listar y cambiar estado (sin borrar)
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    // Filtrar por estado
    List<Pedido> findByEstadoOrderByIdDesc(String estado);
}
