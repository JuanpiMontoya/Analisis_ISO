  import { ChangeDetectionStrategy, Component} from '@angular/core';
  import { Router,RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
  import { CommonModule } from '@angular/common'; 
  import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
  //Angular Material
  import {MatIconModule} from '@angular/material/icon';
  import {MatFormFieldModule} from '@angular/material/form-field';
  import { MatSelectModule } from '@angular/material/select';
  import {MatInputModule} from '@angular/material/input';
  import {MatButtonModule} from '@angular/material/button';
  //empresas
  import { EmpresasService } from '../../servicios/empresas.service';
  //negocios
  import { NegociosService } from '../../servicios/negocios.service';
  //Google maps
  import { GoogleMapsModule } from '@angular/google-maps';

  import { passwordValidator } from '../../servicios/validar-contraseña.service';

  @Component({
    selector: 'app-registrarse',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, FormsModule, CommonModule,
      MatSelectModule, ReactiveFormsModule, MatIconModule, 
      RouterLink, RouterLinkActive, MatButtonModule, GoogleMapsModule],
    templateUrl: './registrarse.component.html',
    styleUrl: './registrarse.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })

  export class RegistrarseComponent{
    //Coordenadas en el mapa 
    center: google.maps.LatLngLiteral = { lat: -17.399945139000618, lng: -66.15775054829115 };
    zoom = 15;
    selectedCoordinates: google.maps.LatLngLiteral = { lat: 0, lng: 0 }; 

    readonly email = new FormControl('', [Validators.required, Validators.email]);
    readonly nombre = new FormControl('', [Validators.required]);
    readonly password = new FormControl('', [Validators.required, passwordValidator()]);
    readonly password_confirm = new FormControl('', [Validators.required]);
    readonly informacion = new FormControl('', [Validators.required]);
    readonly contacto = new FormControl('', [
      Validators.required,
      Validators.pattern('(^[0-9]+$)|(^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$)')
    ]);
    readonly userType = new FormControl('', [Validators.required]); 
    
    hide = true;
    termsAccepted: boolean = false; 
    selectedFile: File | null = null;
    selectedFileQR: File | null = null;

    constructor(private router: Router, private empresasService:EmpresasService, private negociosService:NegociosService) {}

    onFileSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length) {
        const file = input.files[0];
    
        // Validar tipo y tamaño del archivo (opcional)
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          alert('Por favor, selecciona un archivo de imagen válido (png, jpg, webp).');
          return;
        }
        if (file.size > 3 * 1024 * 1024) { 
          alert('El archivo seleccionado es demasiado grande. Máximo 3MB.');
          return;
        }
    
        this.selectedFile = file;
      }
    }

    onFileSelectedQR(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length) {
        const fileQR = input.files[0];
    
        // Validar tipo y tamaño del archivo (opcional)
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(fileQR.type)) {
          alert('Por favor, selecciona un archivo de imagen válido (png, jpg, webp).');
          return;
        }
        if (fileQR.size > 5 * 1024 * 1024) { 
          alert('El archivo seleccionado es demasiado grande. Máximo 5MB.');
          return;
        }
    
        this.selectedFileQR = fileQR;
      }
    }

    togglePasswordVisibility() {
      this.hide = !this.hide;
    }

    togglePasswordConfirmVisibility() {
      this.hide = !this.hide;
    }

    async crearRegistro() {
      // Verificar que todos los campos están completos
      if (
        !this.email.value ||
        !this.nombre.value ||
        !this.password.value ||
        !this.password_confirm.value ||
        !this.informacion.value ||
        !this.contacto.value ||
        (this.selectedCoordinates.lat === 0 && this.selectedCoordinates.lng === 0)
      ) {
        alert('Por favor, complete todos los campos y seleccione una ubicación en el mapa.');
        return;
      }
    
      // Verificaciones adicionales
      if (!this.selectedFile) {
        alert('Por favor, seleccione una foto.');
        return;
      }
    
      if (this.email.invalid) {
        alert('Por favor, ingrese un correo electrónico válido.');
        return;
      }
    
      if (this.password.value !== this.password_confirm.value) {
        alert('Las contraseñas no coinciden');
        return;
      }
    
      if (this.contacto.hasError('pattern')) {
        alert('El campo de contacto debe contener solo números o un correo electrónico válido.');
        return;
      }
    
      // Asignar datos de acuerdo con el usuario seleccionado
      if (this.userType.value === 'empresa') {

        
        if (!this.selectedFileQR) {
          alert('Por favor, seleccione una imagen para el pago por QR.');
          return;
        }
    
        // Asignar valores específicos para empresa
        const formData = new FormData();
        formData.append('nombre', this.nombre.value);
        formData.append('descripcion', this.informacion.value);
        formData.append('correo', this.email.value);
        formData.append('contrasenia', this.password.value);
        formData.append('latitud', this.selectedCoordinates.lat.toString());
        formData.append('longitud', this.selectedCoordinates.lng.toString());
        formData.append('contacto', this.contacto.value);
        formData.append('logo', this.selectedFile!);
        formData.append('QR_pago', this.selectedFileQR!);
    
        try {
          const empresaCreada = await this.empresasService.crearEmpresa(formData);
          alert('Registro de empresa exitoso');
          this.router.navigate(['/inicio']);
        } catch (error) {
          console.error('Error al crear la empresa:', error);
        }
      } else if (this.userType.value === 'negocio') {
        // Crear FormData para enviar al servicio
        console.log('Datos a enviar:', {
          nombre: this.nombre.value,
          informacion: this.informacion.value,
          correo: this.email.value,
          contrasenia: this.password.value,
          latitud: this.selectedCoordinates.lat,
          longitud: this.selectedCoordinates.lng,
          contacto: this.contacto.value,
          foto: this.selectedFile
        });

        const formData = new FormData();
        formData.append('nombre', this.nombre.value);
        formData.append('informacion', this.informacion.value);
        formData.append('correo', this.email.value);
        formData.append('contrasenia', this.password.value);
        formData.append('latitud', this.selectedCoordinates.lat.toString());
        formData.append('longitud', this.selectedCoordinates.lng.toString());
        formData.append('contacto', this.contacto.value);
        formData.append('foto', this.selectedFile!);
      
        try {
          const negocioCreado = await this.negociosService.crearNegocio(formData);
          alert('Registro de negocio exitoso');
          this.router.navigate(['/inicio']);
        } catch (error) {
          console.error('Error al crear el negocio:', error);
        }
      }
    }

    seleccionarPunto(event: google.maps.MapMouseEvent) {
      if (event.latLng) {
        this.selectedCoordinates = event.latLng.toJSON();
      }
    }
  }