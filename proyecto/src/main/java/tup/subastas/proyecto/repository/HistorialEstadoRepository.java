package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.HistorialEstado;

import java.util.List;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Long> {
    List<HistorialEstado> findAllByOrderByFechaDesc();
}
