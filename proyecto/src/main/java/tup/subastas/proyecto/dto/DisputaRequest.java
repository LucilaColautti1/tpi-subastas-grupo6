package tup.subastas.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DisputaRequest {
    @NotBlank
    private String motivo;
    private String descripcion;
}
