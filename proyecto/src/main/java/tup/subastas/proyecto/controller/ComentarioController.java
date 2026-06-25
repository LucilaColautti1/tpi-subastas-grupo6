package tup.subastas.proyecto.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tup.subastas.proyecto.entity.Comentario;
import tup.subastas.proyecto.entity.Subasta;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.repository.ComentarioRepository;
import tup.subastas.proyecto.repository.SubastaRepository;
import tup.subastas.proyecto.repository.UsuarioRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subastas/{subastaId}/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioRepository comentarioRepository;
    private final SubastaRepository subastaRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<Comentario>> listar(@PathVariable Long subastaId) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));
        return ResponseEntity.ok(comentarioRepository.findBySubastaOrderByFechaDesc(subasta));
    }

    @PostMapping
    public ResponseEntity<?> comentar(
            @PathVariable Long subastaId,
            @Valid @RequestBody ComentarioRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Subasta subasta = subastaRepository.findById(subastaId)
                .orElseThrow(() -> new RuntimeException("Subasta no encontrada"));
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Comentario comentario = new Comentario();
        comentario.setSubasta(subasta);
        comentario.setUsuario(usuario);
        comentario.setTexto(req.getTexto());
        return ResponseEntity.ok(comentarioRepository.save(comentario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(
            @PathVariable Long subastaId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        boolean esAdmin = usuario.getRoles().stream().anyMatch(r -> r.getNombre().name().equals("ADMIN"));
        boolean esAutor = comentario.getUsuario().getId().equals(usuario.getId());

        if (!esAdmin && !esAutor)
            return ResponseEntity.status(403).body(Map.of("error", "No autorizado"));

        comentarioRepository.delete(comentario);
        return ResponseEntity.ok(Map.of("mensaje", "Comentario eliminado"));
    }
}

@Data
class ComentarioRequest {
    @NotBlank
    private String texto;
}
