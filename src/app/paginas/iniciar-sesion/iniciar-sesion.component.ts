// iniciar-sesion.component.ts
import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AutenticacionService } from '../../servicios/auth.service';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, RouterModule, CommonModule, FormsModule],
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.scss']
})
export class IniciarSesionComponent {
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);
  userType = new FormControl('', [Validators.required]);
  hide = true;

  // Variables para el bloqueo de acceso
  private failedAttempts = 0;
  private maxAttempts = 3; 
  private lockoutTime = 60000;
  private lockoutTimer: any;
  public isLockedOut = false;

  constructor(private router: Router, private authService: AutenticacionService) {}

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

  async onSubmit(event: Event) {
    console.log('formulario enviado');
    event.preventDefault();
  
    if (this.isLockedOut) {
      alert(`Acceso bloqueado. Intenta de nuevo en ${this.lockoutTime / 1000} segundos.`);
      return;
    }
  
    if (this.email.invalid || this.password.invalid || this.userType.invalid) {
      alert('Por favor completa los campos correctamente.');
      return;
    }
  
    try {
      const response = await this.authService.iniciarSesion(this.email.value!, this.password.value!, this.userType.value!);
      console.log('Respuesta detallada del servidor:', JSON.stringify(response));
      
      // Modificación: simular flujo OTP aunque el backend no lo implemente aún
      if (response.token) {
        // Almacenar el token temporalmente (puedes usar localStorage para esto)
        localStorage.setItem('temp_token', response.token);
        
        // Almacenar temporalmente los datos necesarios para la verificación OTP
        this.authService.almacenarUsuarioTemporal(this.email.value!, this.userType.value!);
        
        // Solicitar el OTP manualmente
        try {
          await this.authService.solicitarOTP(this.email.value!);
          
          // Redirigir a la página de verificación OTP
          this.router.navigate(['/verificar-otp']);
        } catch (otpError) {
          console.error('Error al solicitar OTP:', otpError);
          alert('Error al enviar código de verificación. Iniciando sesión directamente.');
          
          // Como falló el OTP, usar el token recibido directamente
          this.authService.completarLoginConToken(response.token, response.userId, response.userType);
          this.router.navigate(['/inicio']);
        }
      } else {
        // El caso original donde no hay token
        alert('Inicio de sesión exitoso');
        this.router.navigate(['/inicio']);
        this.failedAttempts = 0;
      }
    } catch (error) {
      console.error('Error al iniciar sesión', error);
      this.failedAttempts++;
      const remainingAttempts = this.maxAttempts - this.failedAttempts;
      alert('Credenciales incorrectas. Intentos restantes: ' + remainingAttempts + '/' + this.maxAttempts);
  
      if (this.failedAttempts >= this.maxAttempts) {
        this.isLockedOut = true;
        alert(`Has alcanzado el número máximo de intentos. Tu acceso está bloqueado por ${this.lockoutTime / 1000} segundos.`);
        
        // Iniciar temporizador para desbloquear
        this.lockoutTimer = setTimeout(() => {
          this.isLockedOut = false;
          this.failedAttempts = 0; 
          alert('Puedes intentar iniciar sesión nuevamente.');
        }, this.lockoutTime);
      }
    }
  }

  forgotPassword() {
    alert('Funcionalidad de recuperación de contraseña aún no implementada.');
  }
}