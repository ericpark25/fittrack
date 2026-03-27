package com.example.fittrack.repository;

import com.example.fittrack.model.Workout;
import com.example.fittrack.model.WorkoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {

    // Fetch all workouts belonging to a user, newest date first.
    // Spring Data JPA translates OrderByDateDesc into ORDER BY date DESC automatically.
    List<Workout> findByUserIdOrderByDateDesc(Long userId);

    // Fetch workouts filtered by status, newest first
    List<Workout> findByUserIdAndStatusOrderByDateDesc(Long userId, WorkoutStatus status);

    // Fetch one workout by ID but only if it belongs to this user (security check)
    Optional<Workout> findByIdAndUserId(Long id, Long userId);
}
