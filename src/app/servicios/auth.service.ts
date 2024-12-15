// autenticacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

interface AuthResponse {
  token: string;
  userId: string;
  userType: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  private apiUrl = 'https://proyecto-taller-sis-info-grupo-1.onrender.com';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  async iniciarSesion(email: string, password: string, userType: string): Promise<AuthResponse> {
    try {
      const respuesta: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/iniciar-sesion`, { email, password, userType })
      );
      localStorage.setItem('token', respuesta.token);   
      localStorage.setItem('userId', respuesta.userId);
      localStorage.setItem('userType', respuesta.userType);

      this.isAuthenticatedSubject.next(true);
      return respuesta;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  esUsuarioNegocio(): boolean {
    return localStorage.getItem('userType') === 'negocio';
  }  
  
  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    this.isAuthenticatedSubject.next(false);
  }
}

