package com.example.fittrack.controller;

import com.example.fittrack.dto.request.WorkoutRequest;
import com.example.fittrack.dto.request.WorkoutSetRequest;
import com.example.fittrack.dto.response.WorkoutResponse;
import com.example.fittrack.dto.response.WorkoutSetResponse;
import com.example.fittrack.service.WorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    // Get all workouts for the current user
    @GetMapping
    public ResponseEntity<List<WorkoutResponse>> getAll() {
        return ResponseEntity.ok(workoutService.getAllForCurrentUser());
    }

    // Get a single workout by ID with all its sets
    @GetMapping("/{id}")
    public ResponseEntity<WorkoutResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(workoutService.getById(id));
    }

    // Create a new workout
    @PostMapping
    public ResponseEntity<WorkoutResponse> create(@Valid @RequestBody WorkoutRequest request) {
        return ResponseEntity.ok(workoutService.create(request));
    }

    // Update a workout's name, date, or status
    @PutMapping("/{id}")
    public ResponseEntity<WorkoutResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody WorkoutRequest request) {
        return ResponseEntity.ok(workoutService.update(id, request));
    }

    // Delete a workout and all its sets
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        workoutService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // --- WorkoutSet endpoints (nested under /api/workouts/{workoutId}/sets) ---

    // Log a new set to a workout
    @PostMapping("/{workoutId}/sets")
    public ResponseEntity<WorkoutSetResponse> addSet(@PathVariable Long workoutId,
                                                     @Valid @RequestBody WorkoutSetRequest request) {
        return ResponseEntity.ok(workoutService.addSet(workoutId, request));
    }

    // Update an existing set
    @PutMapping("/{workoutId}/sets/{setId}")
    public ResponseEntity<WorkoutSetResponse> updateSet(@PathVariable Long workoutId,
                                                        @PathVariable Long setId,
                                                        @Valid @RequestBody WorkoutSetRequest request) {
        return ResponseEntity.ok(workoutService.updateSet(workoutId, setId, request));
    }

    // Delete a single set from a workout
    @DeleteMapping("/{workoutId}/sets/{setId}")
    public ResponseEntity<Void> deleteSet(@PathVariable Long workoutId,
                                          @PathVariable Long setId) {
        workoutService.deleteSet(workoutId, setId);
        return ResponseEntity.noContent().build();
    }
}
