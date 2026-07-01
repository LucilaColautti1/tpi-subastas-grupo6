package tup.subastas.proyecto.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void enviar(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Error enviando email: " + e.getMessage());
        }
    }

    public void notificarSubastaCreada(String emailVendedor, String tituloProducto) {
        enviar(emailVendedor,
            "LaCasacaSubastas - Subasta creada",
            "Tu subasta para '" + tituloProducto + "' fue creada exitosamente.\n\n" +
            "Recordá publicarla para que otros usuarios puedan verla.\n\n" +
            "LaCasacaSubastas");
    }

    public void notificarNuevaPuja(String emailVendedor, String tituloProducto, String montoOferta) {
        enviar(emailVendedor,
            "LaCasacaSubastas - Nueva oferta recibida",
            "Tu subasta '" + tituloProducto + "' recibió una nueva oferta de $" + montoOferta + ".\n\n" +
            "Ingresá a la plataforma para ver los detalles.\n\n" +
            "LaCasacaSubastas");
    }

    public void notificarSubastaFinalizada(String emailVendedor, String tituloProducto, boolean conGanador, String precioFinal) {
        String cuerpo;
        if (conGanador) {
            cuerpo = "Tu subasta '" + tituloProducto + "' fue adjudicada por $" + precioFinal + ".\n\n" +
                     "Contactá al ganador para coordinar la entrega.\n\n" +
                     "LaCasacaSubastas";
        } else {
            cuerpo = "Tu subasta '" + tituloProducto + "' finalizó sin ofertas.\n\n" +
                     "Podés crear una nueva subasta desde la plataforma.\n\n" +
                     "LaCasacaSubastas";
        }
        enviar(emailVendedor, "LaCasacaSubastas - Subasta finalizada", cuerpo);
    }

    public void notificarDisputaAbierta(String emailVendedor, String tituloProducto, String motivo) {
        enviar(emailVendedor,
            "LaCasacaSubastas - Disputa abierta en tu subasta",
            "Se abrió una disputa en tu subasta '" + tituloProducto + "'.\n\n" +
            "Motivo: " + motivo + "\n\n" +
            "Un administrador va a revisar el caso.\n\n" +
            "LaCasacaSubastas");
    }

    public void notificarDisputaResuelta(String email, String tituloProducto, String resolucion, String estadoFinal) {
        enviar(email,
            "LaCasacaSubastas - Disputa resuelta",
            "La disputa sobre la subasta '" + tituloProducto + "' fue resuelta.\n\n" +
            "Resolución: " + resolucion + "\n" +
            "Estado final: " + estadoFinal + "\n\n" +
            "LaCasacaSubastas");
    }

    public void notificarGanador(String emailGanador, String tituloProducto, String precioFinal) {
        enviar(emailGanador,
            "LaCasacaSubastas - ¡Ganaste una subasta!",
            "¡Felicitaciones! Ganaste la subasta '" + tituloProducto + "' por $" + precioFinal + ".\n\n" +
            "Contactá al vendedor para coordinar la entrega.\n\n" +
            "LaCasacaSubastas");
    }
}
