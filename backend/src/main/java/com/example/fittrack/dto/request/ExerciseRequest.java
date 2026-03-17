package com.example.fittrack.dto.request;

import com.example.fittrack.model.MuscleGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExerciseRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private MuscleGroup muscleGroup;
}
