package tup.subastas.proyecto.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tup.subastas.proyecto.enums.NombreRol;
import tup.subastas.proyecto.service.AdminService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/usuarios")
    public ResponseEntity<?> listarUsuarios() {
        return ResponseEntity.ok(adminService.listarUsuarios());
    }

    @PostMapping("/usuarios/{id}/bloquear")
    public ResponseEntity<?> bloquear(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminService.bloquear(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/usuarios/{id}/desbloquear")
    public ResponseEntity<?> desbloquear(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminService.desbloquear(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/usuarios/{id}/rol")
    public ResponseEntity<?> asignarRol(
            @PathVariable Long id,
            @RequestParam NombreRol rol) {
        try {
            return ResponseEntity.ok(adminService.asignarRol(id, rol));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
