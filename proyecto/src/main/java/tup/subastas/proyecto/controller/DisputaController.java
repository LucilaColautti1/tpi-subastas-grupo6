package tup.subastas.proyecto.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tup.subastas.proyecto.dto.DisputaRequest;
import tup.subastas.proyecto.dto.ResolucionDisputaRequest;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.repository.UsuarioRepository;
import tup.subastas.proyecto.service.DisputaService;

import java.util.Map;

@RestController
@RequestMapping("/api/disputas")
@RequiredArgsConstructor
public class DisputaController {

    private final DisputaService disputaService;
    private final UsuarioRepository usuarioRepository;
    private final tup.subastas.proyecto.repository.DisputaRepository disputaRepository;

    @GetMapping("/mis-disputas")
    public ResponseEntity<?> misDisputas(@AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        tup.subastas.proyecto.entity.Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(disputaRepository.findByIniciador(usuario));
    }

    @GetMapping("/todas")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> todas() {
        return ResponseEntity.ok(disputaRepository.findAll());
    }

    @PostMapping("/subasta/{subastaId}")
    public ResponseEntity<?> abrir(
            @PathVariable Long subastaId,
            @Valid @RequestBody DisputaRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            return ResponseEntity.ok(disputaService.abrir(subastaId, usuario, req.getMotivo(), req.getDescripcion()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/resolver")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resolver(
            @PathVariable Long id,
            @Valid @RequestBody ResolucionDisputaRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario admin = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            return ResponseEntity.ok(disputaService.resolver(id, admin, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
