package com.example.fittrack.repository;

import com.example.fittrack.model.WorkoutSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutSetRepository extends JpaRepository<WorkoutSet, Long> {

    // Fetch all sets logged in a workout (used when displaying workout details)
    List<WorkoutSet> findByWorkoutId(Long workoutId);

    // Fetch sets for a specific exercise within a workout
    List<WorkoutSet> findByWorkoutIdAndExerciseId(Long workoutId, Long exerciseId);

    // Delete all sets when a workout is deleted (cleanup)
    void deleteByWorkoutId(Long workoutId);
}
