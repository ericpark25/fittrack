package com.example.fittrack.dto.request;

import com.example.fittrack.model.SetType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class WorkoutSetRequest {

    @NotNull(message = "Exercise ID is required")
    private Long exerciseId;

    @NotNull(message = "Set number is required")
    @Min(value = 1, message = "Set number must be at least 1")
    private Integer setNumber;

    // Which visual block this set belongs to (0-based).
    // Assigned by the frontend and used to reconstruct exercise groupings on reload.
    @NotNull(message = "Block index is required")
    @Min(value = 0, message = "Block index cannot be negative")
    private Integer blockIndex;

    @NotNull(message = "Weight is required")
    @Min(value = 0, message = "Weight cannot be negative")
    private Double weight;

    @NotNull(message = "Reps is required")
    @Min(value = 1, message = "Reps must be at least 1")
    private Integer reps;

    // RPE is optional — not every lifter tracks it
    private Double rpe;

    @NotNull(message = "Set type is required")
    private SetType setType;
}
