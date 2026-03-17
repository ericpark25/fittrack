package com.example.fittrack.dto.request;

import com.example.fittrack.model.WorkoutStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class WorkoutRequest {

    @NotBlank(message = "Workout name is required")
    private String name;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Status is required")
    private WorkoutStatus status;
}
