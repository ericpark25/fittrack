import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Workout, WorkoutRequest, WorkoutSet, WorkoutSetRequest } from '../models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {

  private readonly baseUrl = 'http://localhost:8080/api/workouts';

  constructor(private http: HttpClient) {}

  // Fetch all workouts for the logged-in user
  getAll(): Observable<Workout[]> {
    return this.http.get<Workout[]>(this.baseUrl);
  }

  // Fetch a single workout by ID, including all its sets
  getById(id: number): Observable<Workout> {
    return this.http.get<Workout>(`${this.baseUrl}/${id}`);
  }

  // Create a new workout — status is always IN_PROGRESS on creation
  create(request: WorkoutRequest): Observable<Workout> {
    return this.http.post<Workout>(this.baseUrl, request);
  }

  // Update an existing workout's name, description, date, or status
  update(id: number, request: WorkoutRequest): Observable<Workout> {
    return this.http.put<Workout>(`${this.baseUrl}/${id}`, request);
  }

  // Delete a workout and all its sets
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Log a new set to a workout
  addSet(workoutId: number, request: WorkoutSetRequest): Observable<WorkoutSet> {
    return this.http.post<WorkoutSet>(`${this.baseUrl}/${workoutId}/sets`, request);
  }

  // Update an existing set
  updateSet(workoutId: number, setId: number, request: WorkoutSetRequest): Observable<WorkoutSet> {
    return this.http.put<WorkoutSet>(`${this.baseUrl}/${workoutId}/sets/${setId}`, request);
  }

  // Delete a single set from a workout
  deleteSet(workoutId: number, setId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${workoutId}/sets/${setId}`);
  }
}
