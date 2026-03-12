package com.example.fittrack.repository;

import com.example.fittrack.model.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    // Fetch all seeded global exercises (e.g. Bench Press, Squat)
    List<Exercise> findByGlobalTrue();

    // Fetch only the custom exercises a specific user created
    List<Exercise> findByCreatedById(Long userId);

    // Fetch everything the user can see: global exercises + their own custom ones
    List<Exercise> findByGlobalTrueOrCreatedById(Long userId);
}
