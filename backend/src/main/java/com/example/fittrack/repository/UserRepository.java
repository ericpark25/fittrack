package com.example.fittrack.repository;

import com.example.fittrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Load user by username — used during login and JWT validation
    Optional<User> findByUsername(String username);

    // Load user by email — used to check if email is already registered
    Optional<User> findByEmail(String email);

    // Check if username is taken — used during registration
    boolean existsByUsername(String username);

    // Check if email is taken — used during registration
    boolean existsByEmail(String email);
}
