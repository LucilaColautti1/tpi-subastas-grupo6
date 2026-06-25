package tup.subastas.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tup.subastas.proyecto.enums.EstadoSubasta;

@Data
public class ResolucionDisputaRequest {
    @NotBlank
    private String resolucion;
    @NotNull
    private EstadoSubasta estadoFinal; // ADJUDICADA, FINALIZADA o CANCELADA
}
