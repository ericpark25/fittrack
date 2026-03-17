package com.example.fittrack.service;

import com.example.fittrack.dto.request.ExerciseRequest;
import com.example.fittrack.dto.response.ExerciseResponse;
import com.example.fittrack.model.Exercise;
import com.example.fittrack.model.User;
import com.example.fittrack.repository.ExerciseRepository;
import com.example.fittrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    // Returns all exercises the current user can see: global + their own custom ones
    public List<ExerciseResponse> getAllForCurrentUser() {
        User user = getCurrentUser();
        return exerciseRepository.findByGlobalTrueOrCreatedById(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Creates a new custom exercise owned by the current user
    public ExerciseResponse create(ExerciseRequest request) {
        User user = getCurrentUser();
        Exercise exercise = Exercise.builder()
                .name(request.getName())
                .description(request.getDescription())
                .muscleGroup(request.getMuscleGroup())
                .global(false)
                // TODO: if ADMIN role is added, set global=true and createdBy=null instead
                .createdBy(user)
                .build();
        return toResponse(exerciseRepository.save(exercise));
    }

    // Updates a custom exercise — only allowed if the current user owns it
    public ExerciseResponse update(Long id, ExerciseRequest request) {
        User user = getCurrentUser();
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found"));

        if (exercise.isGlobal() || !exercise.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("You can only edit your own custom exercises");
        }

        exercise.setName(request.getName());
        exercise.setDescription(request.getDescription());
        exercise.setMuscleGroup(request.getMuscleGroup());

        return toResponse(exerciseRepository.save(exercise));
    }

    // Deletes a custom exercise — only allowed if the current user owns it
    public void delete(Long id) {
        User user = getCurrentUser();
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found"));

        if (exercise.isGlobal() || !exercise.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own custom exercises");
        }

        exerciseRepository.delete(exercise);
    }

    // Pulls the authenticated user out of the Spring Security context and loads them from the DB
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Maps an Exercise entity to an ExerciseResponse DTO
    private ExerciseResponse toResponse(Exercise exercise) {
        return ExerciseResponse.builder()
                .id(exercise.getId())
                .name(exercise.getName())
                .description(exercise.getDescription())
                .muscleGroup(exercise.getMuscleGroup())
                .global(exercise.isGlobal())
                .createdByUsername(exercise.getCreatedBy() != null ? exercise.getCreatedBy().getUsername() : null)
                .build();
    }
}

// TODO: delete for global exercises (ADMIN function)
