package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Subasta;
import tup.subastas.proyecto.enums.EstadoSubasta;

import java.time.LocalDateTime;
import java.util.List;

public interface SubastaRepository extends JpaRepository<Subasta, Long> {
    List<Subasta> findByEstadoAndFechaCierreBefore(EstadoSubasta estado, LocalDateTime fecha);
    List<Subasta> findByEstado(EstadoSubasta estado);
}
