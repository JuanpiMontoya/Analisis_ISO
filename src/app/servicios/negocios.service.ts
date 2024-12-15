import { Injectable } from '@angular/core';
import { Negocio } from '../interfaces/negocio';

@Injectable({
  providedIn: 'root'
})
export class NegociosService {

  private apiUrl = 'https://proyecto-taller-sis-info-grupo-1.onrender.com/Negocios';

  constructor() { }

  // Obtener el token del localStorage
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Configuración base de headers
  private getHeaders(): Headers {
    const headers = new Headers();
  
    const token = this.getToken();
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
  
    return headers; 
  }
  

  // Método para obtener todas las Negocios
  async getNegocios(): Promise<Negocio[]> {
    const resp = await	fetch(this.apiUrl);
    const Negocios = await resp.json();
    return Negocios;
  }

  async getNegocio(id: number): Promise<Negocio> {
    const resp = await fetch(`${this.apiUrl}/${id}`);
    const Negocio = await resp.json();
    return Negocio;
  }

  // Método para crear un negocio
  async crearNegocio(formData: FormData): Promise<Negocio> {
    const resp = await fetch(this.apiUrl, {
      method: 'POST',
      body: formData,
    });
  
    if (!resp.ok) {
      throw new Error('Error al crear el Negocio');
    }
  
    const nuevoNegocio = await resp.json();
    return nuevoNegocio;
  }

  // Método para actualizar la información de un negocio
  async updateNegocio(id: number, formData: FormData): Promise<Negocio> {
    const resp = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData, 
    });
  
    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.mensaje || 'Error al actualizar el negocio');
    }
  
    return await resp.json();
  }

  async eliminarNegocio(id: number): Promise<void> {
    const resp = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!resp.ok) {
      throw new Error('Error al eliminar la Negocio');
    }

    return;  
  }

}