import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface AuthResponseDTO {
  token: string;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.baseUrl}/api/auth`;

  // Estado reactivo para el usuario actual
  currentUser = signal<AuthResponseDTO | null>(null);

  constructor() {
    // Intentar recuperar la sesión al recargar la página
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = localStorage.getItem('resto_user');
      if (savedUser) {
        this.currentUser.set(JSON.parse(savedUser));
      }
    }
  }

  login(credentials: any): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.setSession(res))
    );
  }

  loginWithPin(pin: string): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.apiUrl}/login/pin`, { pin }).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(data: any): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('resto_user');
    }
    this.currentUser.set(null);
  }

  private setSession(authResult: AuthResponseDTO) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('resto_user', JSON.stringify(authResult));
    }
    this.currentUser.set(authResult);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.role === role : false;
  }
}
