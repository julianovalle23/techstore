package com.roles.usermanagement.modules.articulo;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

// CRUD de Articulo
public interface ArticuloRepository extends JpaRepository<Articulo, Long> {
    // Para validar codigo unico
    boolean existsByCodigo(String codigo);
    // Para no borrar categoria con articulos
    boolean existsByCategoriaId(Long categoriaId);
    // Filtro por categoria
    List<Articulo> findByCategoriaId(Long categoriaId);
    // Alerta reposicion: stockActual <= stockMinimo
    @Query("SELECT a FROM Articulo a WHERE a.stockActual <= a.stockMinimo")
    List<Articulo> findConStockBajo();
    // Bloqueo para descontar stock sin errores
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Articulo a where a.id=:id")
    Optional<Articulo> findForUpdate(@Param("id") Long id);
}
