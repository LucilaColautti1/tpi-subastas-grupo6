package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
}
