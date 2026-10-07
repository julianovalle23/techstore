package com.roles.usermanagement.modules.categoria;

import org.springframework.data.jpa.repository.JpaRepository;

// CRUD de Categoria
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    // Para validar nombre unico
    boolean existsByNombre(String nombre);
}
