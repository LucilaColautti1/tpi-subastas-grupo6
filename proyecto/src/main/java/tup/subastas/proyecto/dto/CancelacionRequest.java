package tup.subastas.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CancelacionRequest {
    @NotBlank
    private String motivo;
}
