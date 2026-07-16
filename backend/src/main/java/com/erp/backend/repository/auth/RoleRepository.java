package com.erp.backend.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.auth.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    java.util.Optional<Role> findByRoleName(String roleName);
}