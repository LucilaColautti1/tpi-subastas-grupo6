package tup.subastas.proyecto.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tup.subastas.proyecto.entity.Usuario;
import tup.subastas.proyecto.repository.UsuarioRepository;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class UserBloqueadoFilter extends OncePerRequestFilter {

    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
            String email = ((org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal()).getUsername();
            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);

            if (usuario != null && usuario.isBloqueado()) {
                String path = request.getRequestURI();
                String method = request.getMethod();

                // Permitir GET para que pueda ver pero no modificar
                if (!method.equals("GET")) {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Tu cuenta está bloqueada. No podés realizar esta acción.\"}");
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }
}
