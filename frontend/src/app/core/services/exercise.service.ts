import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exercise, ExerciseRequest } from '../models/exercise.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly baseUrl = 'http://localhost:8080/api/exercises';

  constructor(private http: HttpClient) {}

  // Fetch all exercises visible to the current user:
  // the 8 seeded global exercises plus any custom ones they've created
  getAll(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(this.baseUrl);
  }

  // Create a new custom exercise for the current user
  create(request: ExerciseRequest): Observable<Exercise> {
    return this.http.post<Exercise>(this.baseUrl, request);
  }

  // Update a custom exercise the current user owns
  update(id: number, request: ExerciseRequest): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.baseUrl}/${id}`, request);
  }

  // Delete a custom exercise the current user owns
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
