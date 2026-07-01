package tup.subastas.proyecto.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tup.subastas.proyecto.dto.CancelacionRequest;
import tup.subastas.proyecto.dto.PujaRequest;
import tup.subastas.proyecto.dto.SubastaRequest;
import tup.subastas.proyecto.entity.*;
import tup.subastas.proyecto.entity.Puja;
import tup.subastas.proyecto.repository.*;
import tup.subastas.proyecto.service.PujaService;
import tup.subastas.proyecto.service.SubastaService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subastas")
@RequiredArgsConstructor
public class SubastaController {

    private final SubastaService subastaService;
    private final PujaService pujaService;
    private final SubastaRepository subastaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PujaRepository pujaRepository;
    private final tup.subastas.proyecto.service.EmailService emailService;

    @GetMapping
    public List<Subasta> listarActivas() {
        return subastaService.listarActivas();
    }

    @GetMapping("/donde-puje")
    public List<Subasta> dondeOferte(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Puja> pujas = pujaRepository.findByUsuario(usuario);
        return pujas.stream()
                .map(Puja::getSubasta)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/mis-subastas")
    public List<Subasta> misSubastas(@AuthenticationPrincipal UserDetails userDetails) {
        Usuario vendedor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return subastaRepository.findByVendedor(vendedor);
    }

    @GetMapping("/publicas")
    public List<Subasta> listarPublicas() {
        return subastaRepository.findAll();
    }

    @GetMapping("/todas")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Subasta> listarTodas() {
        return subastaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subasta> detalle(@PathVariable Long id) {
        return subastaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/seller")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<Subasta> crear(
            @Valid @RequestBody SubastaRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        Usuario vendedor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Producto producto = productoRepository.findById(req.getProductoId()).orElseThrow();

        // Validar que el producto no tenga una subasta activa
        java.util.List<Subasta> subastasExistentes = subastaRepository.findByProducto(producto);
        boolean tieneSubastaActiva = subastasExistentes.stream().anyMatch(s ->
            s.getEstado().name().equals("ACTIVA") ||
            s.getEstado().name().equals("PUBLICADA") ||
            s.getEstado().name().equals("ADJUDICADA") ||
            s.getEstado().name().equals("EN_DISPUTA")
        );
        if (tieneSubastaActiva)
            throw new RuntimeException("Este producto ya tiene una subasta activa o pendiente");

        Subasta subasta = new Subasta();
        subasta.setProducto(producto);
        subasta.setVendedor(vendedor);
        subasta.setPrecioBase(req.getPrecioBase());
        subasta.setMontoActual(req.getPrecioBase());
        subasta.setIncrementoMinimo(req.getIncrementoMinimo());
        subasta.setFechaInicio(req.getFechaInicio());
        subasta.setFechaCierre(req.getFechaCierre());

        Subasta guardada = subastaRepository.save(subasta);
        emailService.notificarSubastaCreada(vendedor.getEmail(), producto.getTitulo());
        return ResponseEntity.ok(guardada);
    }

    @PutMapping("/seller/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<?> editar(
            @PathVariable Long id,
            @Valid @RequestBody tup.subastas.proyecto.dto.SubastaEditRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario actor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            return ResponseEntity.ok(subastaService.editar(id, req, actor));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/seller/{id}/publicar")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<Subasta> publicar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario vendedor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(subastaService.publicar(id, vendedor));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(
            @PathVariable Long id,
            @Valid @RequestBody CancelacionRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario actor = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            return ResponseEntity.ok(subastaService.cancelar(id, actor, req.getMotivo()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/pujar")
    public ResponseEntity<?> pujar(
            @PathVariable Long id,
            @Valid @RequestBody PujaRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        try {
            Puja puja = pujaService.pujar(id, usuario, req.getMonto());
            return ResponseEntity.ok(puja);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/pujas/mias")
    public ResponseEntity<?> misPujas(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Subasta subasta = subastaRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(pujaRepository.findBySubastaAndUsuario(subasta, usuario));
    }

    @GetMapping("/{id}/pujas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> todasLasPujas(@PathVariable Long id) {
        Subasta subasta = subastaRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(pujaRepository.findBySubasta(subasta));
    }
}
