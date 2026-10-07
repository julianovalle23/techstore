package com.roles.usermanagement.modules.articulo;

import com.roles.usermanagement.modules.categoria.Categoria;
import com.roles.usermanagement.modules.categoria.CategoriaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

// Logica de articulos
@Service
@Transactional
public class ArticuloService {

    private final ArticuloRepository repository;
    private final CategoriaRepository categorias;

    public ArticuloService(ArticuloRepository repository, CategoriaRepository categorias) {
        this.repository = repository;
        this.categorias = categorias;
    }

    private ArticuloResponse dto(Articulo e) {
        return new ArticuloResponse(
                e.getId(), e.getCodigo(), e.getNombre(), e.getMarca(), e.getModelo(),
                e.getEspecificaciones(), e.getPrecioUnitario(),
                e.getStockActual(), e.getStockMinimo(), e.getFechaIngreso(),
                e.getCategoria().getId(), e.getCategoria().getNombre());
    }

    // Convierte a vista publica (oculta stockMinimo)
    public static ArticuloPublicDTO aPublico(Articulo e) {
        return new ArticuloPublicDTO(
                e.getId(), e.getCodigo(), e.getNombre(), e.getMarca(), e.getModelo(),
                e.getEspecificaciones(), e.getPrecioUnitario(),
                e.getStockActual(), e.getFechaIngreso(),
                e.getCategoria().getId(), e.getCategoria().getNombre());
    }

    private Articulo existing(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Articulo no encontrado"));
    }

    private Categoria categoria(Long id) {
        return categorias.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria no existe"));
    }

    // Lista con filtros opcionales (categoria y nombre)
    @Transactional(readOnly = true)
    public List<ArticuloPublicDTO> all(Long categoriaId, String nombre) {
        List<Articulo> base = (categoriaId == null)
                ? repository.findAll()
                : repository.findByCategoriaId(categoriaId);
        if (nombre != null && !nombre.isBlank()) {
            String q = nombre.toLowerCase();
            base = base.stream().filter(a -> a.getNombre().toLowerCase().contains(q)).toList();
        }
        return base.stream().map(ArticuloService::aPublico).toList();
    }

    @Transactional(readOnly = true)
    public ArticuloPublicDTO get(Long id) {
        return aPublico(existing(id));
    }

    // Alerta reposicion (ADMIN)
    @Transactional(readOnly = true)
    public List<ArticuloResponse> stockBajo() {
        return repository.findConStockBajo().stream().map(this::dto).toList();
    }

    public ArticuloResponse create(ArticuloRequest d) {
        if (repository.existsByCodigo(d.codigo().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe ese codigo SKU");
        }
        Articulo e = new Articulo();
        e.setCodigo(d.codigo().trim());
        e.setNombre(d.nombre().trim());
        e.setMarca(d.marca());
        e.setModelo(d.modelo());
        e.setEspecificaciones(d.especificaciones());
        e.setPrecioUnitario(d.precioUnitario());
        e.setStockActual(d.stockActual() == null ? 0 : d.stockActual());
        e.setStockMinimo(d.stockMinimo() == null ? 5 : d.stockMinimo());
        e.setFechaIngreso(LocalDate.now());
        e.setCategoria(categoria(d.categoriaId()));
        return dto(repository.save(e));
    }

    public ArticuloResponse update(Long id, ArticuloRequest d) {
        Articulo e = existing(id);
        e.setCodigo(d.codigo().trim());
        e.setNombre(d.nombre().trim());
        e.setMarca(d.marca());
        e.setModelo(d.modelo());
        e.setEspecificaciones(d.especificaciones());
        e.setPrecioUnitario(d.precioUnitario());
        e.setStockActual(d.stockActual() == null ? e.getStockActual() : d.stockActual());
        e.setStockMinimo(d.stockMinimo() == null ? e.getStockMinimo() : d.stockMinimo());
        e.setCategoria(categoria(d.categoriaId()));
        return dto(e);
    }

    public void delete(Long id) {
        existing(id);
        repository.deleteById(id);
    }
}
