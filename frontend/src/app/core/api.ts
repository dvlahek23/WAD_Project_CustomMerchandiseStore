import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getHello(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/hello`);
  }
}
