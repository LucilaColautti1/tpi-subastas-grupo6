package tup.subastas.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tup.subastas.proyecto.dto.ProductoRequest;
import tup.subastas.proyecto.entity.Categoria;
import tup.subastas.proyecto.entity.Producto;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.repository.CategoriaRepository;
import tup.subastas.proyecto.repository.ProductoRepository;
import tup.subastas.proyecto.repository.SubastaRepository;
import tup.subastas.proyecto.entity.Subasta;
import tup.subastas.proyecto.enums.EstadoSubasta;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final SubastaRepository subastaRepository;

    public List<Producto> listarPorVendedor(Usuario vendedor) {
        return productoRepository.findByVendedor(vendedor);
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @Transactional
    public Producto crear(ProductoRequest req, Usuario vendedor) {
        Categoria categoria = categoriaRepository.findById(req.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        Producto producto = new Producto();
        // No editar si tiene subasta activa

        producto.setTitulo(req.getTitulo());
        producto.setDescripcion(req.getDescripcion());
        producto.setCategoria(categoria);
        producto.setVendedor(vendedor);
        if (req.getImagenBase64() != null && !req.getImagenBase64().isEmpty()) producto.setImagenBase64(req.getImagenBase64());
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto editar(Long id, ProductoRequest req, Usuario actor) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        boolean esAdmin = actor.getRoles().stream()
                .anyMatch(r -> r.getNombre().name().equals("ADMIN"));
        if (!esAdmin && !producto.getVendedor().getId().equals(actor.getId()))
            throw new RuntimeException("No autorizado");

        Categoria categoria = categoriaRepository.findById(req.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        producto.setTitulo(req.getTitulo());
        producto.setDescripcion(req.getDescripcion());
        producto.setCategoria(categoria);
        if (req.getImagenBase64() != null && !req.getImagenBase64().isEmpty()) producto.setImagenBase64(req.getImagenBase64());
        return productoRepository.save(producto);
    }

    @Transactional
    public void eliminar(Long id, Usuario actor) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        boolean esAdmin = actor.getRoles().stream()
                .anyMatch(r -> r.getNombre().name().equals("ADMIN"));
        if (!esAdmin && !producto.getVendedor().getId().equals(actor.getId()))
            throw new RuntimeException("No autorizado");

        // No eliminar si tiene subastas activas
        List<Subasta> subastas = subastaRepository.findByProducto(producto);
        boolean tieneSubastaActiva = subastas.stream().anyMatch(s ->
            s.getEstado() == EstadoSubasta.ACTIVA ||
            s.getEstado() == EstadoSubasta.PUBLICADA ||
            s.getEstado() == EstadoSubasta.ADJUDICADA ||
            s.getEstado() == EstadoSubasta.EN_DISPUTA
        );
        if (tieneSubastaActiva)
            throw new RuntimeException("No se puede eliminar un producto con subastas activas o pendientes");

        productoRepository.delete(producto);
    }
}
