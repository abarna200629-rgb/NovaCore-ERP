package com.erp.backend.jwt;


import java.io.IOException;
import java.util.List;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;

import org.springframework.web.filter.OncePerRequestFilter;



@Component
public class JwtFilter extends OncePerRequestFilter {


@Override
protected void doFilterInternal(

HttpServletRequest request,

HttpServletResponse response,

FilterChain filterChain)

throws ServletException, IOException {



String path =
request.getServletPath();



if(path.startsWith("/api/auth") || path.startsWith("/actuator") || path.equals("/api/health") || path.equals("/health")){

filterChain.doFilter(
request,
response
);

return;

}



String header =
request.getHeader("Authorization");



if(header==null ||
!header.startsWith("Bearer ")){

response.setStatus(
HttpServletResponse.SC_UNAUTHORIZED
);

return;

}



String token =
header.substring(7);



if(!JwtUtil.validateToken(token)){


response.setStatus(
HttpServletResponse.SC_UNAUTHORIZED
);

return;

}



String username =
JwtUtil.extractUsername(token);


String role =
JwtUtil.extractRole(token);



System.out.println(
"JWT USER = "
+username
);


System.out.println(
"JWT ROLE = "
+role
);



        String cleanRole = role != null ? role.trim().toUpperCase() : "EMPLOYEE";
        String rawRole = cleanRole.startsWith("ROLE_") ? cleanRole.substring(5) : cleanRole;
        String roleWithPrefix = "ROLE_" + rawRole;

        UsernamePasswordAuthenticationToken authentication =

        new UsernamePasswordAuthenticationToken(

        username,

        null,

        List.of(
            new SimpleGrantedAuthority(roleWithPrefix),
            new SimpleGrantedAuthority(rawRole)
        )

        );



SecurityContextHolder
.getContext()
.setAuthentication(
authentication
);



filterChain.doFilter(
request,
response
);


}


}