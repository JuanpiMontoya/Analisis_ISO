// Corrección para auth.service.ts
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

  public isAuthenticatedSubject = new BehaviorSubject<boolean>(true);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar estado de autenticación al iniciar
    console.log('Estado inicial de autenticación:', this.isAuthenticated());
    console.log('Datos en localStorage:', {
      token: localStorage.getItem('token') ? 'presente' : 'ausente',
      userId: localStorage.getItem('userId'),
      userType: localStorage.getItem('userType')
    });
  }

  async iniciarSesion(email: string, password: string, userType: string): Promise<AuthResponse> {
    try {
      console.log('Iniciando sesión con:', { email, userType });
      
      const respuesta: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/iniciar-sesion`, { email, password, userType })
      );
      
      console.log('Respuesta de iniciar sesión:', respuesta);
      
      // Si no requiere OTP, guardar el token directamente
      if (!respuesta.requireOTP && respuesta.token) {
        this.completarLoginConToken(respuesta.token, respuesta.userId, respuesta.userType);
      } else if (respuesta.requireOTP) {
        // Almacenar los datos temporalmente para el flujo OTP
        this.almacenarUsuarioTemporal(email, userType);
      }
      
      return respuesta;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

    // Método para solicitar el envío de OTP
    async solicitarOTP(email: string): Promise<any> {
      try {
        const response = await firstValueFrom(
          this.http.post<any>(`${this.apiUrl}/auth/solicitar-otp`, { email })
        );
        console.log('Respuesta exitosa al solicitar OTP:', response);
        return response;
      } catch (error) {
        console.error('Error detallado al solicitar OTP:', error);
        throw error;
      }
    }

  // Método mejorado para completar el login con token
  completarLoginConToken(token: string, userId: string, userType: string): void {
    console.log('Completando login con token:', { token: token.substring(0, 10) + '...', userId, userType });
    
    try {
      
      // Forzar una pequeña pausa entre limpiar y guardar (puede ayudar con problemas de timing)
      setTimeout(() => {
        // Almacenar nuevos datos de sesión
        localStorage.setItem('token', token);   
        localStorage.setItem('userId', userId);
        localStorage.setItem('userType', userType);
        
        // Verificar que los datos se almacenaron correctamente
        const storedToken = localStorage.getItem('token');
        
        console.log('Token almacenado correctamente:', !!storedToken);
        
        // Actualizar estado de autenticación
        this.isAuthenticatedSubject.next(true);
      }, 50);
    } catch (e) {
      console.error('Error al almacenar datos de sesión:', e);
      alert('Error al almacenar los datos de sesión.');
    }
  }

  async verificarOTP(email: string, otpCode: string): Promise<AuthResponse> {
    try {
      console.log('Verificando OTP para:', email);
      
      const respuesta: AuthResponse = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/verificar-otp`, { email, otpCode })
      );
  
      // 🔥 Aquí agregamos el log para ver la respuesta del backend
      console.log('Respuesta completa de verificación OTP:', JSON.stringify(respuesta));
  
      if (respuesta.success && respuesta.token) {
        console.log('Token recibido, intentando almacenar...');
        
        try {
          localStorage.setItem('token', respuesta.token);
          localStorage.setItem('userId', respuesta.userId);
          localStorage.setItem('userType', respuesta.userType);
      
          // 🔹 Verificar si el token realmente se guardó
          console.log('Token almacenado en localStorage:', localStorage.getItem('token') || 'FALLO');
      
          this.isAuthenticatedSubject.next(true);
          this.limpiarUsuarioTemporal();
        } catch (e) {
          console.error('Error al almacenar el token en localStorage:', e);
        }
      } else {
        console.warn('La verificación OTP no fue exitosa o falta el token:', respuesta);
      }

      return respuesta;
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const result = !!token;
    console.log('Verificando autenticación, token:', token ? 'presente' : 'ausente', 'resultado:', result);
    return result;
  }

  esUsuarioNegocio(): boolean {
    return localStorage.getItem('userType') === 'negocio';
  }  
  
  cerrarSesion(): void {
    console.log('Cerrando sesión, eliminando datos de autenticación');
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
    console.log('Recuperando usuario temporal:', tempUser);
    return tempUser ? JSON.parse(tempUser) : null;
  }

  limpiarUsuarioTemporal(): void {
    sessionStorage.removeItem('tempUser');
  }

}