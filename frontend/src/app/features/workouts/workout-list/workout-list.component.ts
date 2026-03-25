import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { WorkoutService } from '../../../core/services/workout.service';
import { Workout, WorkoutRequest } from '../../../core/models/workout.model';

@Component({
  selector: 'app-workout-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
    InputTextModule,
  ],
  templateUrl: './workout-list.component.html',
  styleUrl: './workout-list.component.scss',
})
export class WorkoutListComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // ── List state ──────────────────────────────────────────────────────
  workouts = signal<Workout[]>([]);
  loading = signal(true);

  // ── Dialog state ────────────────────────────────────────────────────
  // Controls whether the modal is open
  dialogVisible = signal(false);

  // Holds the workout being edited; null means we're in "create" mode
  editingWorkout = signal<Workout | null>(null);

  // Prevents double-clicks while the HTTP request is in flight
  saving = signal(false);

  // ── Status dropdown options (shown in edit mode only) ──────────────
  statusOptions = [
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  // ── Reactive form shared by both create and edit ───────────────────
  workoutForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''], // optional
    date: [new Date(), Validators.required],
    status: ['IN_PROGRESS'], // always IN_PROGRESS on create; editable in edit mode
  });

  // Convenience getter used in the template to switch between create/edit labels
  get isEdit(): boolean {
    // Reading a signal inside a getter is fine — Angular's template reactive context
    // tracks the signal read and re-evaluates when editingWorkout changes.
    return this.editingWorkout() !== null;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadWorkouts();
  }

  // ── Data loading ────────────────────────────────────────────────────
  loadWorkouts(): void {
    this.loading.set(true);
    this.workoutService.getAll().subscribe({
      next: (data) => {
        this.workouts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Navigation ──────────────────────────────────────────────────────
  openWorkout(id: number): void {
    this.router.navigate(['/workouts', id]);
  }

  // ── Dialog control ──────────────────────────────────────────────────

  openCreateModal(): void {
    this.editingWorkout.set(null);
    // Reset to blank state with today's date pre-filled
    this.workoutForm.reset({
      name: '',
      description: '',
      date: new Date(),
      status: 'IN_PROGRESS',
    });
    this.dialogVisible.set(true);
  }

  openEditModal(workout: Workout, event: Event): void {
    // Stop propagation so clicking the edit button doesn't also navigate to the detail page
    event.stopPropagation();
    this.editingWorkout.set(workout);

    this.workoutForm.patchValue({
      name: workout.name,
      description: workout.description ?? '',
      // Append T00:00:00 so the date is parsed as LOCAL midnight rather than
      // UTC midnight (which can shift the displayed date by one day for users
      // west of UTC).
      date: new Date(workout.date + 'T00:00:00'),
      status: workout.status,
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  // ── Form submission ─────────────────────────────────────────────────
  saveWorkout(): void {
    if (this.workoutForm.invalid) return;

    this.saving.set(true);
    const { name, description, date, status } = this.workoutForm.value;

    // The backend expects dates as 'YYYY-MM-DD' strings, but the DatePicker
    // gives us a Date object. We format it manually to avoid UTC offset issues
    // that toISOString() would introduce.
    const d: Date = date instanceof Date ? date : new Date(date);
    const formattedDate = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    const request: WorkoutRequest = {
      name,
      description: description || undefined, // send undefined (omitted) if empty string
      date: formattedDate,
      // In create mode we always start workouts as IN_PROGRESS
      status: this.isEdit ? status : 'IN_PROGRESS',
    };

    const editing = this.editingWorkout();
    if (editing) {
      this.workoutService.update(editing.id, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.loadWorkouts(); // refresh the list to reflect the changes
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.workoutService.create(request).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.loadWorkouts();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────
  deleteWorkout(id: number, event: Event): void {
    event.stopPropagation(); // prevent navigating to the detail page
    if (!confirm('Delete this workout? This cannot be undone.')) return;

    this.workoutService.delete(id).subscribe({
      next: () => {
        // Optimistically remove from the list without a full refetch
        this.workouts.update((ws) => ws.filter((w) => w.id !== id));
      },
    });
  }
}
