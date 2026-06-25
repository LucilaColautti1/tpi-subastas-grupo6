package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Puja;
import tup.subastas.proyecto.entity.Subasta;
import tup.subastas.proyecto.entity.Usuario;

import java.util.List;
import java.util.Optional;

public interface PujaRepository extends JpaRepository<Puja, Long> {
    Optional<Puja> findTopBySubastaOrderByMontoDesc(Subasta subasta);
    List<Puja> findBySubastaAndUsuario(Subasta subasta, Usuario usuario);
    List<Puja> findBySubasta(Subasta subasta);
    List<Puja> findByUsuario(tup.subastas.proyecto.entity.Usuario usuario);
}
