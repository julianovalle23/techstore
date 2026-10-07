package com.roles.usermanagement.modules.pedido;

import com.roles.usermanagement.modules.articulo.Articulo;
import com.roles.usermanagement.modules.articulo.ArticuloRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// Logica de pedidos y stock
@Service
@Transactional
public class PedidoService {

    private final PedidoRepository repository;
    private final ArticuloRepository articulos;

    public PedidoService(PedidoRepository repository, ArticuloRepository articulos) {
        this.repository = repository;
        this.articulos = articulos;
    }

    private PedidoResponse dto(Pedido p) {
        return new PedidoResponse(
                p.getId(), p.getFecha(),
                p.getCompradorNombre(), p.getCompradorDocumento(),
                p.getCompradorCorreo(), p.getCompradorTelefono(),
                p.getArticulo().getId(), p.getArticulo().getNombre(),
                p.getCantidad(), p.getPrecioUnitario(), p.getTotal(),
                p.getMetodoPago(), p.getEstado());
    }

    private Pedido existing(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> all(String estado) {
        List<Pedido> base = (estado == null || estado.isBlank())
                ? repository.findAll()
                : repository.findByEstadoOrderByIdDesc(estado);
        return base.stream().map(this::dto).toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse get(Long id) {
        return dto(existing(id));
    }

    // Crea pedido: valida stock, copia precio, calcula total, descuenta
    public PedidoResponse create(PedidoRequest d) {
        // Bloqueo para no vender mas de lo que hay
        Articulo art = articulos.findForUpdate(d.articuloId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Articulo no existe"));
        if (art.getStockActual() < d.cantidad()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stock insuficiente (hay " + art.getStockActual() + ")");
        }
        Pedido p = new Pedido();
        p.setCompradorNombre(d.compradorNombre().trim());
        p.setCompradorDocumento(d.compradorDocumento());
        p.setCompradorCorreo(d.compradorCorreo());
        p.setCompradorTelefono(d.compradorTelefono());
        p.setArticulo(art);
        p.setCantidad(d.cantidad());
        // Precio y total los pone el backend, no el frontend
        p.setPrecioUnitario(art.getPrecioUnitario());
        p.setTotal(art.getPrecioUnitario().multiply(BigDecimal.valueOf(d.cantidad())));
        p.setMetodoPago(d.metodoPago());
        p.setEstado("PENDIENTE");
        p.setFecha(LocalDateTime.now());
        // Descuenta stock
        art.setStockActual(art.getStockActual() - d.cantidad());
        return dto(repository.save(p));
    }

    // Cambia estado; si pasa a CANCELADO devuelve el stock
    public PedidoResponse cambiarEstado(Long id, String nuevo) {
        Pedido p = existing(id);
        String viejo = p.getEstado();
        if (viejo.equals(nuevo)) return dto(p);
        // Bloqueo del articulo para mover stock
        Articulo art = articulos.findForUpdate(p.getArticulo().getId()).orElseThrow();
        // Entra a CANCELADO: devuelve unidades
        if (nuevo.equals("CANCELADO") && !viejo.equals("CANCELADO")) {
            art.setStockActual(art.getStockActual() + p.getCantidad());
        }
        // Sale de CANCELADO: descuenta de nuevo (valida stock)
        if (viejo.equals("CANCELADO") && !nuevo.equals("CANCELADO")) {
            if (art.getStockActual() < p.getCantidad()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Sin stock para reactivar el pedido");
            }
            art.setStockActual(art.getStockActual() - p.getCantidad());
        }
        p.setEstado(nuevo);
        return dto(p);
    }
}
