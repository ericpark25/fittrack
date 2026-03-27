package com.example.fittrack.service;

import com.example.fittrack.dto.request.WorkoutRequest;
import com.example.fittrack.dto.request.WorkoutSetRequest;
import com.example.fittrack.dto.response.WorkoutResponse;
import com.example.fittrack.dto.response.WorkoutSetResponse;
import com.example.fittrack.model.*;
import com.example.fittrack.repository.ExerciseRepository;
import com.example.fittrack.repository.UserRepository;
import com.example.fittrack.repository.WorkoutRepository;
import com.example.fittrack.repository.WorkoutSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final WorkoutSetRepository workoutSetRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    // Returns all workouts belonging to the current user, each with their sets
    public List<WorkoutResponse> getAllForCurrentUser() {
        User user = getCurrentUser();
        return workoutRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Returns a single workout by ID — throws if not found or doesn't belong to the current user
    public WorkoutResponse getById(Long id) {
        User user = getCurrentUser();
        Workout workout = workoutRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Workout not found"));
        return toResponse(workout);
    }

    // Creates a new workout for the current user
    public WorkoutResponse create(WorkoutRequest request) {
        User user = getCurrentUser();
        Workout workout = Workout.builder()
                .name(request.getName())
                .description(request.getDescription())
                .date(request.getDate())
                .status(request.getStatus())
                .user(user)
                .build();
        return toResponse(workoutRepository.save(workout));
    }

    // Updates a workout's name, date, or status — only if it belongs to the current user
    public WorkoutResponse update(Long id, WorkoutRequest request) {
        User user = getCurrentUser();
        Workout workout = workoutRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        workout.setName(request.getName());
        workout.setDescription(request.getDescription());
        workout.setDate(request.getDate());
        workout.setStatus(request.getStatus());

        return toResponse(workoutRepository.save(workout));
    }

    // Deletes a workout and all its sets (cascade is handled by the Workout entity's orphanRemoval)
    public void delete(Long id) {
        User user = getCurrentUser();
        Workout workout = workoutRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Workout not found"));
        workoutRepository.delete(workout);
    }

    // Logs a new set to an existing workout
    public WorkoutSetResponse addSet(Long workoutId, WorkoutSetRequest request) {
        User user = getCurrentUser();

        // Verify the workout belongs to the current user
        Workout workout = workoutRepository.findByIdAndUserId(workoutId, user.getId())
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        // Verify the exercise exists and is visible to this user (global or their own custom)
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new RuntimeException("Exercise not found"));

        WorkoutSet set = WorkoutSet.builder()
                .workout(workout)
                .exercise(exercise)
                .setNumber(request.getSetNumber())
                .blockIndex(request.getBlockIndex())
                .weight(request.getWeight())
                .reps(request.getReps())
                .rpe(request.getRpe())
                .setType(request.getSetType())
                .build();

        // e1rm is calculated automatically by @PrePersist on the WorkoutSet entity
        return toSetResponse(workoutSetRepository.save(set));
    }

    // Updates an existing set — only if the set belongs to the current user's workout
    public WorkoutSetResponse updateSet(Long workoutId, Long setId, WorkoutSetRequest request) {
        User user = getCurrentUser();

        // Confirm the workout belongs to the current user before touching any of its sets
        workoutRepository.findByIdAndUserId(workoutId, user.getId())
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        WorkoutSet set = workoutSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Set not found"));

        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new RuntimeException("Exercise not found"));

        set.setExercise(exercise);
        set.setSetNumber(request.getSetNumber());
        set.setWeight(request.getWeight());
        set.setReps(request.getReps());
        set.setRpe(request.getRpe());
        set.setSetType(request.getSetType());

        // @PreUpdate on WorkoutSet will recalculate e1rm automatically
        return toSetResponse(workoutSetRepository.save(set));
    }

    // Deletes a single set — only if the parent workout belongs to the current user
    @Transactional
    public void deleteSet(Long workoutId, Long setId) {
        User user = getCurrentUser();

        // Confirm ownership of the workout before deleting any of its sets
        workoutRepository.findByIdAndUserId(workoutId, user.getId())
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        workoutSetRepository.deleteById(setId);
    }

    // Pulls the authenticated user out of the Spring Security context and loads them from the DB
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Maps a Workout entity to a WorkoutResponse DTO, including all its sets
    private WorkoutResponse toResponse(Workout workout) {
        List<WorkoutSetResponse> sets = workout.getSets()
                .stream()
                .map(this::toSetResponse)
                .toList();

        return WorkoutResponse.builder()
                .id(workout.getId())
                .name(workout.getName())
                .description(workout.getDescription())
                .date(workout.getDate())
                .status(workout.getStatus())
                .sets(sets)
                .build();
    }

    // Maps a WorkoutSet entity to a WorkoutSetResponse DTO
    private WorkoutSetResponse toSetResponse(WorkoutSet set) {
        return WorkoutSetResponse.builder()
                .id(set.getId())
                .exerciseId(set.getExercise().getId())
                .exerciseName(set.getExercise().getName())
                .setNumber(set.getSetNumber())
                .blockIndex(set.getBlockIndex())
                .weight(set.getWeight())
                .reps(set.getReps())
                .rpe(set.getRpe())
                .setType(set.getSetType())
                .e1rm(set.getE1rm())
                .build();
    }
}
