package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Producto;
import tup.subastas.proyecto.entity.Usuario;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByVendedor(Usuario vendedor);
}
