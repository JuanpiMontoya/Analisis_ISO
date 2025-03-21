// verificar-otp.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AutenticacionService } from '../../servicios/auth.service';

@Component({
  selector: 'app-verificar-otp',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterModule, CommonModule],
  templateUrl: './verificar-otp.component.html',
  styleUrls: ['./verificar-otp.component.scss']
})
export class VerificarOTPComponent implements OnInit, OnDestroy {
  otpCode = new FormControl('', [
    Validators.required, 
    Validators.pattern('^[0-9]{6}$')
  ]);
  
  email: string | null = null;
  remainingTime = 300; // 5 minutos en segundos
  timerInterval: any;
  
  constructor(private router: Router, private authService: AutenticacionService) {}
  
  ngOnInit(): void {
    // Recuperar datos del usuario desde el almacenamiento temporal
    const tempUser = this.authService.obtenerUsuarioTemporal();
    
    if (!tempUser) {
      alert('No se encontró información de sesión. Por favor, inicie sesión nuevamente.');
      this.router.navigate(['/iniciar-sesion']);
      return;
    }
    
    this.email = tempUser.email;
    this.startTimer();
  }
  
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      
      if (this.remainingTime <= 0) {
        clearInterval(this.timerInterval);
        alert('El código OTP ha expirado. Por favor, inicie sesión nuevamente.');
        this.authService.limpiarUsuarioTemporal();
        this.router.navigate(['/iniciar-sesion']);
      }
    }, 1000);
  }
  
  formatTime(): string {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  
  async onSubmit(): Promise<void> {
    if (this.otpCode.invalid || !this.email) {
      return;
    }
    
    try {
      const response = await this.authService.verificarOTP(this.email, this.otpCode.value!);
      
      if (response.success) {
        alert('Verificación exitosa. Iniciando sesión...');
        this.router.navigate(['/inicio']);
      } else {
        alert(response.mensaje || 'Código OTP incorrecto. Por favor, intente nuevamente.');
      }
    } catch (error: any) {
      console.error('Error al verificar OTP:', error);
      alert(error.error?.mensaje || 'Error al verificar el código OTP. Por favor, intente más tarde.');
    }
  }
  
  async resendOTP(): Promise<void> {
    if (!this.email) return;
    
    try {
      const response = await this.authService.solicitarOTP(this.email);
      
      if (response.success) {
        alert('Se ha enviado un nuevo código OTP a su correo electrónico.');
        
        // Reiniciar el temporizador
        clearInterval(this.timerInterval);
        this.remainingTime = 300;
        this.startTimer();
      } else {
        alert(response.mensaje || 'Error al reenviar el código. Por favor, intente más tarde.');
      }
    } catch (error: any) {
      console.error('Error al reenviar OTP:', error);
      alert(error.error?.mensaje || 'Error al reenviar el código OTP. Por favor, intente más tarde.');
    }
  }
  
  cancelar(): void {
    this.authService.limpiarUsuarioTemporal();
    this.router.navigate(['/iniciar-sesion']);
  }
} 