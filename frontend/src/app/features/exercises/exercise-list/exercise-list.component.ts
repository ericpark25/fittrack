import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Exercise, MuscleGroup } from '../../../core/models/exercise.model';

@Component({
  selector: 'app-exercise-list',
  imports: [CommonModule, NgClass],
  templateUrl: './exercise-list.component.html',
  styleUrl: './exercise-list.component.scss',
})
export class ExerciseListComponent implements OnInit {
  private exerciseService = inject(ExerciseService);

  exercises = signal<Exercise[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  globalExercises = computed(() => this.exercises().filter(e => e.global));
  customExercises = computed(() => this.exercises().filter(e => !e.global));

  ngOnInit(): void {
    this.exerciseService.getAll().subscribe({
      next: (data) => {
        this.exercises.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load exercises. Please try again.');
        this.loading.set(false);
      },
    });
  }

  muscleGroupLabel(mg: MuscleGroup): string {
    const labels: Record<MuscleGroup, string> = {
      CHEST: 'Chest',
      BACK: 'Back',
      SHOULDERS: 'Shoulders',
      ARMS: 'Arms',
      LEGS: 'Legs',
      CORE: 'Core',
      FULL_BODY: 'Full Body',
    };
    return labels[mg] ?? mg;
  }
}
