package com.roles.usermanagement.modules.categoria;

import com.roles.usermanagement.modules.articulo.ArticuloRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

// Logica de categorias
@Service
@Transactional
public class CategoriaService {

    private final CategoriaRepository repository;
    private final ArticuloRepository articulos;

    public CategoriaService(CategoriaRepository repository, ArticuloRepository articulos) {
        this.repository = repository;
        this.articulos = articulos;
    }

    private CategoriaResponse dto(Categoria e) {
        return new CategoriaResponse(e.getId(), e.getNombre(), e.getDescripcion(), e.getEstado());
    }

    private Categoria existing(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria no encontrada"));
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> all() {
        return repository.findAll().stream().map(this::dto).toList();
    }

    @Transactional(readOnly = true)
    public CategoriaResponse get(Long id) {
        return dto(existing(id));
    }

    public CategoriaResponse create(CategoriaRequest d) {
        // Nombre unico
        if (repository.existsByNombre(d.nombre().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe esa categoria");
        }
        Categoria e = new Categoria();
        e.setNombre(d.nombre().trim());
        e.setDescripcion(d.descripcion());
        e.setEstado(d.estado() == null ? "activa" : d.estado());
        return dto(repository.save(e));
    }

    public CategoriaResponse update(Long id, CategoriaRequest d) {
        Categoria e = existing(id);
        e.setNombre(d.nombre().trim());
        e.setDescripcion(d.descripcion());
        e.setEstado(d.estado() == null ? e.getEstado() : d.estado());
        return dto(e);
    }

    public void delete(Long id) {
        existing(id);
        // No borrar si tiene articulos
        if (articulos.existsByCategoriaId(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede borrar: tiene articulos");
        }
        repository.deleteById(id);
    }
}
