package com.example.fittrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_sets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_id", nullable = false)
    private Workout workout;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "set_number", nullable = false)
    private Integer setNumber;

    // Identifies which visual exercise block this set belongs to.
    // All sets logged under the same exercise card share the same blockIndex.
    // This lets us reconstruct the correct grouping on reload, even if the same
    // exercise appears more than once (interleaved training).
    @Column(name = "block_index", nullable = false)
    private Integer blockIndex;

    @Column(nullable = false)
    private Double weight;

    @Column(nullable = false)
    private Integer reps;

    private Double rpe;

    @Enumerated(EnumType.STRING)
    @Column(name = "set_type", nullable = false)
    private SetType setType;

    @Column(name = "e1rm")
    private Double e1rm;

    // Automatically set by Hibernate on INSERT — used to preserve insertion order when displaying sets
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Automatically updated by Hibernate on every UPDATE
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void calculateE1rm() {
        if (weight != null && reps != null && reps > 0) {
            // Epley formula: weight * (1 + reps / 30)
            this.e1rm = weight * (1 + reps / 30.0);
        }
    }
}
