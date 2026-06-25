package tup.subastas.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tup.subastas.proyecto.entity.Rol;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.enums.NombreRol;
import tup.subastas.proyecto.repository.RolRepository;
import tup.subastas.proyecto.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    @Transactional
    public Usuario bloquear(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setBloqueado(true);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario desbloquear(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setBloqueado(false);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario asignarRol(Long usuarioId, NombreRol nombreRol) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Rol rol = rolRepository.findByNombre(nombreRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        usuario.getRoles().add(rol);
        return usuarioRepository.save(usuario);
    }

    public java.util.List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }
}
