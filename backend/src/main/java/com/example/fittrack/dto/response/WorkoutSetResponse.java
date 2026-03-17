package com.example.fittrack.dto.response;

import com.example.fittrack.model.SetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WorkoutSetResponse {

    private Long id;
    private Long exerciseId;
    private String exerciseName;  // included so the frontend doesn't need a separate lookup
    private Integer setNumber;
    private Double weight;
    private Integer reps;
    private Double rpe;
    private SetType setType;
    private Double e1rm;          // auto-calculated by the entity before save
}
