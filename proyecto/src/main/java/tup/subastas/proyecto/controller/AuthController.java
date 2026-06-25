package tup.subastas.proyecto.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import tup.subastas.proyecto.dto.LoginRequest;
import tup.subastas.proyecto.dto.RegisterRequest;
import tup.subastas.proyecto.entity.Rol;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.enums.NombreRol;
import tup.subastas.proyecto.repository.RolRepository;
import tup.subastas.proyecto.repository.UsuarioRepository;
import tup.subastas.proyecto.security.JwtUtil;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        String token = jwtUtil.generateToken(auth.getName());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (usuarioRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email ya registrado"));
        }

        Rol rol = rolRepository.findByNombre(NombreRol.USER)
                .orElseThrow(() -> new RuntimeException("Rol USER no encontrado"));

        Usuario usuario = new Usuario();
        usuario.setNombre(req.getNombre());
        usuario.setEmail(req.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        usuario.setRoles(Set.of(rol));

        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario registrado correctamente"));
    }
}
