package tup.subastas.proyecto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tup.subastas.proyecto.entity.Rol;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.enums.NombreRol;
import tup.subastas.proyecto.repository.RolRepository;
import tup.subastas.proyecto.repository.UsuarioRepository;
import tup.subastas.proyecto.service.AdminService;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock UsuarioRepository usuarioRepository;
    @Mock RolRepository rolRepository;

    @InjectMocks AdminService adminService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Test User");
        usuario.setEmail("test@test.com");
        usuario.setBloqueado(false);
        usuario.setRoles(new HashSet<>());
    }

    @Test
    void bloquear_exitoso() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any())).thenReturn(usuario);

        Usuario resultado = adminService.bloquear(1L);

        assertTrue(resultado.isBloqueado());
    }

    @Test
    void desbloquear_exitoso() {
        usuario.setBloqueado(true);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any())).thenReturn(usuario);

        Usuario resultado = adminService.desbloquear(1L);

        assertFalse(resultado.isBloqueado());
    }

    @Test
    void bloquear_fallaUsuarioNoExiste() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> adminService.bloquear(99L));
    }

    @Test
    void asignarRol_exitoso() {
        Rol rol = new Rol();
        rol.setNombre(NombreRol.SELLER);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByNombre(NombreRol.SELLER)).thenReturn(Optional.of(rol));
        when(usuarioRepository.save(any())).thenReturn(usuario);

        Usuario resultado = adminService.asignarRol(1L, NombreRol.SELLER);

        assertTrue(resultado.getRoles().contains(rol));
    }

    @Test
    void asignarRol_fallaRolNoExiste() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByNombre(NombreRol.ADMIN)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> adminService.asignarRol(1L, NombreRol.ADMIN));
    }

    @Test
    void quitarRol_exitoso() {
        Rol rol = new Rol();
        rol.setNombre(NombreRol.SELLER);
        usuario.getRoles().add(rol);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByNombre(NombreRol.SELLER)).thenReturn(Optional.of(rol));
        when(usuarioRepository.save(any())).thenReturn(usuario);

        Usuario resultado = adminService.quitarRol(1L, NombreRol.SELLER);

        assertFalse(resultado.getRoles().contains(rol));
    }
}
