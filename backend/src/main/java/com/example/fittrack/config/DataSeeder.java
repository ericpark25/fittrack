package com.example.fittrack.config;

import com.example.fittrack.model.Exercise;
import com.example.fittrack.model.MuscleGroup;
import com.example.fittrack.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;

    @Override
    public void run(String... args) {
        // Only seed if no global exercises exist yet — prevents duplicates on restart
        if (exerciseRepository.findByGlobalTrue().isEmpty()) {
            List<Exercise> exercises = List.of(
                    build("Bench Press", "Barbell press on a flat bench", MuscleGroup.CHEST),
                    build("Squat", "Barbell back squat", MuscleGroup.LEGS),
                    build("Deadlift", "Conventional barbell deadlift", MuscleGroup.BACK),
                    build("Lat Pull Down", "Cable lat pull down to chest", MuscleGroup.BACK),
                    build("Dumbbell Bicep Curl", "Alternating dumbbell curl", MuscleGroup.ARMS),
                    build("Cable Tricep Pushdown", "Cable pushdown with rope or bar", MuscleGroup.ARMS),
                    build("Push-Up", "Bodyweight chest press", MuscleGroup.CHEST),
                    build("Pull-Up", "Bodyweight vertical pull", MuscleGroup.BACK)
            );
            exerciseRepository.saveAll(exercises);
        }
    }

    // Helper to build a global exercise (no createdBy user)
    private Exercise build(String name, String description, MuscleGroup muscleGroup) {
        return Exercise.builder()
                .name(name)
                .description(description)
                .muscleGroup(muscleGroup)
                .global(true)
                .createdBy(null)
                .build();
    }
}
