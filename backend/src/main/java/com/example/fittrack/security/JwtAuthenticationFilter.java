package com.example.fittrack.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Grab the Authorization header from the request
        final String authHeader = request.getHeader("Authorization");

        // 2. If there's no header or it doesn't start with "Bearer ", skip this filter entirely
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Strip "Bearer " prefix to get just the raw token
        final String token = authHeader.substring(7);

        // 4. Extract the username embedded in the token
        final String username = jwtUtil.extractUsername(token);

        // 5. Only proceed if we got a username and the user isn't already authenticated
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 6. Load the full user from the database
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // 7. Validate the token against this user
            if (jwtUtil.isTokenValid(token, userDetails)) {

                // 8. Create an authentication object and set it in the SecurityContext
                //    This is what tells Spring Security "this request is authenticated"
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 9. Pass the request along to the next filter or controller
        filterChain.doFilter(request, response);
    }
}
