package com.example.fittrack.dto.response;

import com.example.fittrack.model.MuscleGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ExerciseResponse {

    private Long id;
    private String name;
    private String description;
    private MuscleGroup muscleGroup;
    private boolean global;
    private String createdByUsername; // null for global exercises
}
