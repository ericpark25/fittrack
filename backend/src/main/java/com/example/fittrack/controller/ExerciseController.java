package com.example.fittrack.controller;

import com.example.fittrack.dto.request.ExerciseRequest;
import com.example.fittrack.dto.response.ExerciseResponse;
import com.example.fittrack.service.ExerciseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    // Get all exercises visible to the current user (global + their custom ones)
    @GetMapping
    public ResponseEntity<List<ExerciseResponse>> getAll() {
        return ResponseEntity.ok(exerciseService.getAllForCurrentUser());
    }

    // Create a new custom exercise for the current user
    @PostMapping
    public ResponseEntity<ExerciseResponse> create(@Valid @RequestBody ExerciseRequest request) {
        return ResponseEntity.ok(exerciseService.create(request));
    }

    // Update a custom exercise owned by the current user
    @PutMapping("/{id}")
    public ResponseEntity<ExerciseResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody ExerciseRequest request) {
        return ResponseEntity.ok(exerciseService.update(id, request));
    }

    // Delete a custom exercise owned by the current user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        exerciseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
