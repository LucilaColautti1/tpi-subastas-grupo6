package tup.subastas.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tup.subastas.proyecto.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
}
