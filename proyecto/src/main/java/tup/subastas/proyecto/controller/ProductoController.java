package tup.subastas.proyecto.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tup.subastas.proyecto.dto.ProductoRequest;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.repository.UsuarioRepository;
import tup.subastas.proyecto.service.ProductoService;

import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<?> listar(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        boolean esAdmin = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre().name().equals("ADMIN"));
        if (esAdmin) return ResponseEntity.ok(productoService.listarTodos());
        return ResponseEntity.ok(productoService.listarPorVendedor(usuario));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<?> crear(
            @Valid @RequestBody ProductoRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario vendedor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(productoService.crear(req, vendedor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<?> editar(
            @PathVariable Long id,
            @Valid @RequestBody ProductoRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario actor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            return ResponseEntity.ok(productoService.editar(id, req, actor));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<?> eliminar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario actor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            productoService.eliminar(id, actor);
            return ResponseEntity.ok(Map.of("mensaje", "Producto eliminado"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
