import { Injectable } from '@angular/core';
import { Empresa } from '../interfaces/empresa';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {

  private apiUrl = 'https://proyecto-taller-sis-info-grupo-1.onrender.com/empresas';

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
  

  // Método para obtener todas las empresas
  async getEmpresas(): Promise<Empresa[]> {
    const resp = await	fetch(this.apiUrl);
    const empresas = await resp.json();
    return empresas;
  }

  async getEmpresa(id: number): Promise<Empresa> {
    const resp = await fetch(`${this.apiUrl}/${id}`);
    const empresa = await resp.json();
    return empresa;
  }

  async crearEmpresa(formData: FormData): Promise<Empresa> {
    const resp = await fetch(this.apiUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData, 
    });

    if (!resp.ok) {
      throw new Error('Error al crear la empresa');
    }

    const nuevoEmpresa = await resp.json();
    return nuevoEmpresa;
  }
  
  // Método para actualizar la información de un negocio
  async updateEmpresa(id: number, formData: FormData): Promise<Empresa> {
    const resp = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData,
    });
  
    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.mensaje || 'Error al actualizar la empresa');
    }
  
    return await resp.json();
  }
  

  async eliminarEmpresa(id: number): Promise<void> {
    const resp = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!resp.ok) {
      throw new Error('Error al eliminar la empresa');
    }

    return; 
  }

}
