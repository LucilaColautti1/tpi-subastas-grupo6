package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Puja;
import tup.subastas.proyecto.entity.Subasta;

import java.util.Optional;

public interface PujaRepository extends JpaRepository<Puja, Long> {
    Optional<Puja> findTopBySubastaOrderByMontoDesc(Subasta subasta);
}
