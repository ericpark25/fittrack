import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { WorkoutService } from '../../../core/services/workout.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Workout, WorkoutSet, WorkoutSetRequest, SetType } from '../../../core/models/workout.model';
import { Exercise } from '../../../core/models/exercise.model';

// ── View models ───────────────────────────────────────────────────────────────

// Represents one exercise card on the page. blockIndex is a stable identifier
// assigned when the block is created and stored on every set in that block.
// This allows the grouping to be reconstructed correctly on page reload,
// even when the same exercise appears more than once (interleaved training).
interface ExerciseBlock {
  blockIndex: number;   // 0-based, unique per block within this workout session
  exerciseId: number;
  exerciseName: string;
  sets: WorkoutSet[];
  collapsed: boolean;   // controls whether the set table and form are visible
}

// Holds the transient form state for the "Log Set" row at the bottom of each
// exercise block card. Keyed by blockIndex in the blockForms signal so each
// block has its own independent weight/reps/rpe inputs.
interface BlockFormState {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  setType: SetType;
  submitting: boolean;  // true while the addSet request for this block is in flight
}

@Component({
  selector: 'app-workout-detail',
  imports: [
    CommonModule,
    FormsModule,   // required for [(ngModel)] on the p-select
    SelectModule,  // PrimeNG dropdown / select
  ],
  templateUrl: './workout-detail.component.html',
  styleUrl: './workout-detail.component.scss',
})
export class WorkoutDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workoutService = inject(WorkoutService);
  private exerciseService = inject(ExerciseService);

  // ── Remote data ───────────────────────────────────────────────────────────
  workout = signal<Workout | null>(null);
  exercises = signal<Exercise[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = signal(true);
  error = signal(false);
  toggling = signal(false); // true while complete/reopen request is in flight

  // ── Exercise blocks ───────────────────────────────────────────────────────
  // Derived from the workout's sets on load, extended as the user adds exercises.
  exerciseBlocks = signal<ExerciseBlock[]>([]);

  // ── Exercise picker state ─────────────────────────────────────────────────
  // The id of the exercise currently selected in the dropdown; null means none.
  selectedExerciseId = signal<number | null>(null);

  // Weight, reps, and RPE entered in the picker before clicking "+ Add".
  // These become the first set of the new block.
  pickerWeight = signal<number | null>(null);
  pickerReps = signal<number | null>(null);
  pickerRpe = signal<number | null>(null);
  pickerSetType = signal<SetType>('WORKING');

  // True while the addSet API call is in flight — prevents double-submits
  addingExercise = signal(false);

  // Per-block log-set form state, keyed by blockIndex.
  // Using a Record instead of individual signals keeps all form state in one
  // place and avoids a proliferating number of signals as blocks are added.
  blockForms = signal<Record<number, BlockFormState>>({});

  // The id of the set currently being deleted — null when no delete is in flight.
  // Only one delete at a time to keep the UX predictable.
  deletingSetId = signal<number | null>(null);

  // The id of the set currently being duplicated — null when idle.
  duplicatingSetId = signal<number | null>(null);

  // RPE options for the picker and set-log dropdowns.
  // null value = "not set" (RPE is optional).
  readonly rpeOptions = [
    { label: '—', value: null },
    ...Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 })),
  ];

  // Set type options — defaults to Normal so users who don't care can ignore it
  readonly setTypeOptions = [
    { label: 'Working', value: 'WORKING' },
    { label: 'Warmup',  value: 'WARMUP'  },
    { label: 'Drop',    value: 'DROP'    },
  ];

  // Exercises grouped by muscle group for PrimeNG's grouped select.
  // computed() re-derives automatically whenever exercises() changes.
  exerciseOptions = computed(() => {
    // Use a Map to preserve insertion order within each muscle group
    const grouped = new Map<string, { id: number; name: string }[]>();

    for (const ex of this.exercises()) {
      const bucket = grouped.get(ex.muscleGroup) ?? [];
      bucket.push({ id: ex.id, name: ex.name });
      grouped.set(ex.muscleGroup, bucket);
    }

    // Convert to the shape PrimeNG expects: [{ label, items[] }, ...]
    return Array.from(grouped.entries()).map(([rawLabel, items]) => ({
      label: this.formatMuscleGroup(rawLabel),
      items,
    }));
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Fetch the workout and the exercise list in parallel — no reason to wait
    // for one before starting the other
    forkJoin({
      workout: this.workoutService.getById(id),
      exercises: this.exerciseService.getAll(),
    }).subscribe({
      next: ({ workout, exercises }) => {
        this.workout.set(workout);
        this.exercises.set(exercises);
        // Convert the flat set array into consecutive exercise blocks for display
        this.exerciseBlocks.set(this.groupSetsIntoBlocks(workout.sets));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/workouts']);
  }

  // ── Status toggle ─────────────────────────────────────────────────────────
  // Flips the workout between IN_PROGRESS and COMPLETED.
  // All other fields are passed through unchanged — the backend requires the
  // full WorkoutRequest object, not a partial patch.
  toggleStatus(): void {
    const w = this.workout();
    if (!w || this.toggling()) return;

    this.toggling.set(true);
    const newStatus = w.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS';

    this.workoutService
      .update(w.id, {
        name: w.name,
        description: w.description,
        date: w.date,
        status: newStatus,
      })
      .subscribe({
        next: (updated) => {
          this.workout.set(updated);
          this.toggling.set(false);
        },
        error: () => this.toggling.set(false),
      });
  }

  // ── Exercise picker ───────────────────────────────────────────────────────
  // Logs the first set for a new exercise block in one action (Option B).
  // The block is only created locally after the API call succeeds, so there
  // are never empty blocks — every card is guaranteed to have at least one set.
  addExerciseBlock(): void {
    const exerciseId = this.selectedExerciseId();
    const weight = this.pickerWeight();
    const reps = this.pickerReps();
    const w = this.workout();

    // All three are required; RPE is optional
    if (!exerciseId || weight === null || !reps || !w || this.addingExercise()) return;

    const exercise = this.exercises().find((e) => e.id === exerciseId);
    if (!exercise) return;

    // blockIndex = number of blocks already on the page (0-based, always incrementing).
    // Stored on the set in the DB so groupSetsIntoBlocks() can reconstruct this block on reload.
    const blockIndex = this.exerciseBlocks().length;

    this.addingExercise.set(true);

    const request: WorkoutSetRequest = {
      exerciseId,
      blockIndex,
      setNumber: 1,
      weight,
      reps,
      rpe: this.pickerRpe() ?? undefined,
      setType: this.pickerSetType(),
    };

    this.workoutService.addSet(w.id, request).subscribe({
      next: (newSet) => {
        // Create the block in memory using the set the server just returned.
        // Using the server response (not the request) ensures the e1rm value is included.
        this.exerciseBlocks.update((blocks) => [
          ...blocks,
          { blockIndex, exerciseId: exercise.id, exerciseName: exercise.name, sets: [newSet], collapsed: false },
        ]);

        // Reset all picker fields so the user can immediately add the next exercise
        this.selectedExerciseId.set(null);
        this.pickerWeight.set(null);
        this.pickerReps.set(null);
        this.pickerRpe.set(null);
        this.pickerSetType.set('WORKING');
        this.addingExercise.set(false);
      },
      error: () => this.addingExercise.set(false),
    });
  }

  // ── Set logging ───────────────────────────────────────────────────────────

  // Logs an additional set to an existing exercise block.
  // setNumber is derived from the current number of sets already in the block.
  logSet(block: ExerciseBlock): void {
    const form = this.getForm(block.blockIndex);
    const w = this.workout();

    if (!form.weight || !form.reps || !w || form.submitting) return;

    this.setFormField(block.blockIndex, 'submitting', true);

    const request: WorkoutSetRequest = {
      exerciseId: block.exerciseId,
      blockIndex: block.blockIndex,
      setNumber: block.sets.length + 1,
      weight: form.weight,
      reps: form.reps,
      rpe: form.rpe ?? undefined,
      setType: form.setType,
    };

    this.workoutService.addSet(w.id, request).subscribe({
      next: (newSet) => {
        // Append the new set to this block's set list
        this.exerciseBlocks.update((blocks) =>
          blocks.map((b) =>
            b.blockIndex === block.blockIndex
              ? { ...b, sets: [...b.sets, newSet] }
              : b
          )
        );
        // Reset the form for this block so the user can log the next set
        this.blockForms.update((forms) => ({
          ...forms,
          [block.blockIndex]: { weight: null, reps: null, rpe: null, setType: 'WORKING', submitting: false },
        }));
      },
      error: () => this.setFormField(block.blockIndex, 'submitting', false),
    });
  }

  // Duplicates a set by creating a new one with identical fields at the end
  // of the same block. setNumber is always the next in sequence.
  duplicateSet(block: ExerciseBlock, set: WorkoutSet): void {
    const w = this.workout();
    if (!w || this.duplicatingSetId() !== null) return;

    this.duplicatingSetId.set(set.id);

    const request: WorkoutSetRequest = {
      exerciseId: block.exerciseId,
      blockIndex: block.blockIndex,
      setNumber: block.sets.length + 1,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe ?? undefined,
      setType: set.setType,
    };

    this.workoutService.addSet(w.id, request).subscribe({
      next: (newSet) => {
        this.exerciseBlocks.update((blocks) =>
          blocks.map((b) =>
            b.blockIndex === block.blockIndex
              ? { ...b, sets: [...b.sets, newSet] }
              : b
          )
        );
        this.duplicatingSetId.set(null);
      },
      error: () => this.duplicatingSetId.set(null),
    });
  }

  // Deletes a single set. If it was the last set in its block, the block is
  // also removed — an empty block has no meaning in our data model.
  deleteSet(block: ExerciseBlock, setId: number): void {
    const w = this.workout();
    if (!w || this.deletingSetId() !== null) return;

    this.deletingSetId.set(setId);

    this.workoutService.deleteSet(w.id, setId).subscribe({
      next: () => {
        this.exerciseBlocks.update((blocks) =>
          blocks
            .map((b) =>
              b.blockIndex === block.blockIndex
                ? { ...b, sets: b.sets.filter((s) => s.id !== setId) }
                : b
            )
            // Remove the block entirely if it now has no sets
            .filter((b) => b.sets.length > 0)
        );
        this.deletingSetId.set(null);
      },
      error: () => this.deletingSetId.set(null),
    });
  }

  // ── Block collapse ────────────────────────────────────────────────────────

  // Flips the collapsed state of a single block without affecting the others.
  toggleBlock(blockIndex: number): void {
    this.exerciseBlocks.update((blocks) =>
      blocks.map((b) =>
        b.blockIndex === blockIndex ? { ...b, collapsed: !b.collapsed } : b
      )
    );
  }

  // ── Block form helpers ────────────────────────────────────────────────────

  // Returns the form state for a given block, defaulting to empty if not yet initialised.
  getForm(blockIndex: number): BlockFormState {
    return (
      this.blockForms()[blockIndex] ?? {
        weight: null,
        reps: null,
        rpe: null,
        setType: 'WORKING',
        submitting: false,
      }
    );
  }

  // Updates a single field in a block's form state.
  // Reading blockForms() in the template will re-evaluate whenever this is called.
  setFormField(blockIndex: number, field: keyof BlockFormState, value: number | SetType | boolean | null): void {
    const current = this.getForm(blockIndex);
    this.blockForms.update((forms) => ({
      ...forms,
      [blockIndex]: { ...current, [field]: value },
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Reconstructs ExerciseBlock[] from a flat WorkoutSet[] using blockIndex.
  // Sets are grouped by their blockIndex, and blocks are ordered by the
  // blockIndex value itself (which was assigned in ascending order at creation time).
  // This correctly handles interleaved training and survives page reloads.
  private groupSetsIntoBlocks(sets: WorkoutSet[]): ExerciseBlock[] {
    const blockMap = new Map<number, ExerciseBlock>();

    for (const set of sets) {
      if (!blockMap.has(set.blockIndex)) {
        // First time we've seen this blockIndex — create the block
        blockMap.set(set.blockIndex, {
          blockIndex: set.blockIndex,
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          sets: [],
          collapsed: false,  // always start expanded on page load
        });
      }
      blockMap.get(set.blockIndex)!.sets.push(set);
    }

    // Sort by blockIndex to restore the original creation order
    return Array.from(blockMap.values()).sort((a, b) => a.blockIndex - b.blockIndex);
  }

  // 'FULL_BODY' → 'Full body', 'CHEST' → 'Chest', etc.
  private formatMuscleGroup(group: string): string {
    return (
      group.charAt(0).toUpperCase() +
      group.slice(1).toLowerCase().replace('_', ' ')
    );
  }

  // Formats 'YYYY-MM-DD' → 'Month DD, YYYY' using local time.
  // Appending T00:00:00 avoids the UTC-midnight shift that would otherwise
  // display the previous day for users west of UTC.
  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
