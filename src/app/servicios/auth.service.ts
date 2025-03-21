// autenticacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

interface AuthResponse {
  token?: string;
  userId: string;
  userType: string;
  requireOTP?: boolean;
  success?: boolean;
  mensaje?: string;
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
      
      // Si no requiere OTP, guardar el token directamente (comportamiento original)
      if (!respuesta.requireOTP && respuesta.token) {
        localStorage.setItem('token', respuesta.token);   
        localStorage.setItem('userId', respuesta.userId);
        localStorage.setItem('userType', respuesta.userType);
        this.isAuthenticatedSubject.next(true);
      }
      
      return respuesta;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  // En AutenticacionService
  completarLoginConToken(token: string, userId: string, userType: string): void {
    localStorage.setItem('token', token);   
    localStorage.setItem('userId', userId);
    localStorage.setItem('userType', userType);
    this.isAuthenticatedSubject.next(true);
  }

  // Método para solicitar el envío de OTP
  async solicitarOTP(email: string): Promise<AuthResponse> {
    try {
      return await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/solicitar-otp`, { email })
      );
    } catch (error) {
      console.error('Error al solicitar OTP:', error);
      throw error;
    }
  }

  // Método para verificar OTP
  async verificarOTP(email: string, otpCode: string): Promise<AuthResponse> {
    try {
      const respuesta: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/verificar-otp`, { email, otpCode })
      );
      
      // Si la verificación fue exitosa, almacenar los datos de sesión
      if (respuesta.success && respuesta.token) {
        localStorage.setItem('token', respuesta.token);   
        localStorage.setItem('userId', respuesta.userId);
        localStorage.setItem('userType', respuesta.userType);
        this.isAuthenticatedSubject.next(true);
        
        // Limpiar datos temporales
        this.limpiarUsuarioTemporal();
      }
      
      return respuesta;
    } catch (error) {
      console.error('Error al verificar OTP:', error);
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
    this.limpiarUsuarioTemporal();
    this.isAuthenticatedSubject.next(false);
  }
  
  almacenarUsuarioTemporal(email: string, userType: string): void {
    console.log('Almacenando usuario temporal:', { email, userType });
    sessionStorage.setItem('tempUser', JSON.stringify({ email, userType }));
    // Verificar que se guardó correctamente
    const stored = sessionStorage.getItem('tempUser');
    console.log('Usuario temporal almacenado:', stored);
  }

  obtenerUsuarioTemporal(): { email: string, userType: string } | null {
    const tempUser = sessionStorage.getItem('tempUser');
    return tempUser ? JSON.parse(tempUser) : null;
  }

  limpiarUsuarioTemporal(): void {
    sessionStorage.removeItem('tempUser');
  }
}