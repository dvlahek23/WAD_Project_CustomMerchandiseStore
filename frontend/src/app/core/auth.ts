import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post('/api/auth/login', { email, password });
  }

  register(username: string, email: string, password: string) {
    return this.http.post('/api/auth/register', { username, email, password });
  }

  logout() {
    return this.http.post('/api/auth/logout', {});
  }

  me() {
    return this.http.get('/api/auth/me');
  }

  checkUsernameAvailability(username: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`/api/auth/check-username/${encodeURIComponent(username)}`);
  }

  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`/api/auth/check-email/${encodeURIComponent(email)}`);
  }

  requestDesigner(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/request-designer', {});
  }

  getMyDesignerRequest(): Observable<any> {
    return this.http.get('/api/auth/my-designer-request');
  }

  // Management endpoints
  getDesignerRequests(): Observable<any[]> {
    return this.http.get<any[]>('/api/auth/designer-requests');
  }

  approveDesignerRequest(requestId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/auth/designer-requests/${requestId}/approve`, {});
  }

  denyDesignerRequest(requestId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/auth/designer-requests/${requestId}/deny`, {});
  }

  // Admin endpoints
  getLogs(): Observable<any[]> {
    return this.http.get<any[]>('/api/auth/logs');
  }

  // Admin endpoints
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/auth/users');
  }

  updateUserRole(userId: number, roleId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`/api/auth/users/${userId}/role`, { roleId });
  }

  addUserType(userId: number, userTypeId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/auth/users/${userId}/types`, { userTypeId });
  }

  removeUserType(userId: number, typeId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/auth/users/${userId}/types/${typeId}`);
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/auth/users/${userId}`);
  }
}
