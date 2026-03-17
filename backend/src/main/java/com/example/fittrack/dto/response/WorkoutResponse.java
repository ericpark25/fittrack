package com.example.fittrack.dto.response;

import com.example.fittrack.model.WorkoutStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class WorkoutResponse {

    private Long id;
    private String name;
    private LocalDate date;
    private WorkoutStatus status;
    private List<WorkoutSetResponse> sets; // all sets logged in this workout, grouped by exercise on the frontend
}
