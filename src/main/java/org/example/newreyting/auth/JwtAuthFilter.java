package org.example.newreyting.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;
    // Shu yerda to'g'ridan-to'g'ri yaratiladi (Spring bean sifatida INJECT qilinmaydi) — bu
    // klassning o'zi holatsiz va bog'liqliklarsiz, DI orqali olish esa SecurityConfig bilan
    // AYLANMA BOG'LIQLIK (circular dependency) hosil qilib, ilova butunlay ishga tushmay
    // qolishiga sabab bo'lgan edi (SecurityConfig -> JwtAuthFilter -> SecurityContextRepository
    // bean -> SecurityConfig).
    private final SecurityContextRepository securityContextRepository = new RequestAttributeSecurityContextRepository();

    public JwtAuthFilter(JwtService jwtService, AppUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
                String login = jwtService.extractLogin(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(login);
                if (userDetails.isEnabled()) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(auth);
                    SecurityContextHolder.setContext(context);
                    // ThreadLocal'dagi SecurityContextHolder'ga qo'yish KIFOYA EMAS — agar bu
                    // so'rovning qolgan qismi (masalan @RequestBody o'qilishi I/O sabab kechiksa)
                    // boshqa threadda davom etsa, o'sha threadning ThreadLocal'i bo'sh bo'lib,
                    // keyingi @PreAuthorize tekshiruvi autentifikatsiyani "yo'q" deb topib,
                    // noto'g'ri 403 qaytarardi (aniqlangan, takrorlanuvchi xato). Repository
                    // orqali so'rov ATTRIBUTE'iga ham yozib qo'yish threaddan mustaqil saqlanishini
                    // kafolatlaydi.
                    securityContextRepository.saveContext(context, request, response);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
