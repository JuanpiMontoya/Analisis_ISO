import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
//Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
//empresas
import { Empresa } from '../../interfaces/empresa';
import { EmpresasService } from '../../servicios/empresas.service';
//negocios
import { Negocio } from '../../interfaces/negocio';
import { NegociosService } from '../../servicios/negocios.service';
//Google maps
import { GoogleMapsModule } from '@angular/google-maps';
import { passwordValidator } from '../../servicios/validar-contraseña.service'; // Asegúrate de importar tu validador

@Component({
  selector: 'app-editar-cuenta',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule,
    MatSelectModule, CommonModule, MatButtonModule,
    ReactiveFormsModule,
    GoogleMapsModule, TextFieldModule],
  templateUrl: './editar-cuenta.component.html',
  styleUrls: ['./editar-cuenta.component.scss']
})

export class EditarCuentaComponent implements OnInit {
  editarCuentaForm: FormGroup;
  userType: string | null;
  userId: number;    
  hide = true;
  selectedImage: File | null = null;
  selectedImageQR: File | null = null;
  imageUrl: string = '';
  imageQR: string = '';

  selectedCoordinates: google.maps.LatLngLiteral = { lat: 0, lng: 0 }; 
  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 }; 
  zoom = 18; 

  previousPassword: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private empresasService: EmpresasService, 
    private negociosService: NegociosService,
  ) {
    this.userType = localStorage.getItem('userType');
    this.userId = Number(localStorage.getItem('userId')) || 0; 
    this.editarCuentaForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      nuevaContraseña: ['', [passwordValidator()]], // Agregar validador de contraseña
      confirmarContraseña: ['', Validators.required],
      contacto: [''],
      logo: [''], 
      descripcion: [''], 
      qr_pago: ['']
    }, { validators: this.passwordMatchValidator }); // Agregar validador de coincidencia de contraseñas
  }

  ngOnInit(): void {
    if (this.userId !== null) {
      this.cargarDatosUsuario();
    } else {
      console.error('Error: userId es null');
    }
  }

  // Validador para verificar que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup) {
    return form.get('nuevaContraseña')?.value === form.get('confirmarContraseña')?.value
      ? null : { mismatch: true };
  }


  onImageSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedImage = file;
  
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageSelectedQR(event: any): void {
    const fileQR: File = event.target.files[0];
    if (fileQR) {
      this.selectedImageQR = fileQR;
  
      const reader = new FileReader();
      reader.onload = () => {
        this.imageQR = reader.result as string;
      };
      reader.readAsDataURL(fileQR);
    }
  }

    seleccionarPunto(event: google.maps.MapMouseEvent) {
      if (event.latLng) {
        this.selectedCoordinates = event.latLng.toJSON();
      }
    }

    async cargarDatosUsuario(): Promise<void> {
      try {
        if (this.userType === 'empresa') {
          // Llama al servicio para obtener los datos de la empresa
          const empresa: Empresa = await this.empresasService.getEmpresa(this.userId);
    
          this.editarCuentaForm.patchValue({
            nombre: empresa.nombre,
            correo: empresa.correo,
            contacto: empresa.contacto,
            descripcion: empresa.descripcion,
            qr_pago: empresa.QR_pago
          });
    
          this.imageUrl = empresa.logo;
          this.imageQR = empresa.QR_pago;
          this.previousPassword = empresa.contraseña; 
    
          // Cargar coordenadas de la empresa
          this.selectedCoordinates.lat = Number(empresa.latitud);
          this.selectedCoordinates.lng = Number(empresa.longitud);
    
          this.center = { lat: this.selectedCoordinates.lat, lng: this.selectedCoordinates.lng };
        } else if (this.userType === 'negocio') {
          // Llama al servicio para obtener los datos del negocio
          const negocio: Negocio = await this.negociosService.getNegocio(this.userId);
    
          this.editarCuentaForm.patchValue({
            nombre: negocio.nombre,
            correo: negocio.correo,
            contacto: negocio.contacto,
            descripcion: negocio.informacion
          });
    
          this.imageUrl = negocio.foto;
          this.imageQR = '';
          this.previousPassword = negocio.contraseña;
    
          // Cargar coordenadas del negocio
          this.selectedCoordinates.lat = Number(negocio.latitud);
          this.selectedCoordinates.lng = Number(negocio.longitud);
    
          this.center = { lat: this.selectedCoordinates.lat, lng: this.selectedCoordinates.lng };
        }
      } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
      }
    }    

    togglePasswordVisibility() {
      this.hide = !this.hide;
    }
    
    async onSubmit(): Promise<void> {
      if (this.editarCuentaForm.valid) {
          const formData = new FormData();

          const formValues = this.editarCuentaForm.value; 
          
          formData.append('nombre', formValues.nombre || '');
          formData.append('correo', formValues.correo || '');
          formData.append('contacto', formValues.contacto || '');
          formData.append('descripcion', formValues.descripcion || '');
          formData.append('latitud', this.selectedCoordinates.lat.toString());
          formData.append('longitud', this.selectedCoordinates.lng.toString());

          if (formValues.nuevaContraseña) {
            formData.append('nuevaContraseña', formValues.nuevaContraseña);
          }

    
        try {
          if (this.userType === 'negocio') {
            if (this.selectedImage) {
              formData.append('foto', this.selectedImage);
            }

            await this.negociosService.updateNegocio(this.userId, formData);
            alert('Negocio actualizado con éxito');
            window.location.reload();
          } else if (this.userType === 'empresa') {
            if (this.selectedImage) {
              formData.append('logo', this.selectedImage);
            }

            if (this.selectedImageQR) {
              formData.append('QR_pago', this.selectedImageQR);
            }

            await this.empresasService.updateEmpresa(this.userId, formData);
            alert('Empresa actualizada con éxito');
            window.location.reload();
          }
        } catch (error) {
          console.error('Error al actualizar:', error);
          alert('Error al actualizar la información. Por favor, intente nuevamente.');
        }
      } else {
        alert('Por favor, complete todos los campos requeridos correctamente.');
      }
    }
}
