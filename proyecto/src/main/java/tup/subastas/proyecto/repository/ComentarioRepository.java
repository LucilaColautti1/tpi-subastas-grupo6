package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Comentario;
import tup.subastas.proyecto.entity.Subasta;

import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findBySubastaOrderByFechaDesc(Subasta subasta);
}
