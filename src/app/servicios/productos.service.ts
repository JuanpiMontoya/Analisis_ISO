import { Injectable } from '@angular/core';
import { Producto } from '../interfaces/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'https://proyecto-taller-sis-info-grupo-1.onrender.com/productos';

  constructor() { }

  // Método para obtener todos los productos
  async getProductos(): Promise<Producto[]> {
    const resp = await fetch(this.apiUrl);
    const productos = await resp.json();
    return productos;
  }

  async getProductoPorId(id: number): Promise<Producto> {
    const resp = await fetch(`${this.apiUrl}/${id}`);
    const producto = await resp.json();
    return producto;
  }

  async crearProducto(producto: Producto): Promise<Producto> {
    const resp = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(producto),
    });

    if (!resp.ok) {
      throw new Error('Error al crear el producto');
    }

    const nuevoProducto = await resp.json();
    return nuevoProducto;
  }

  async actualizarProducto(id: number, producto: Producto): Promise<Producto> {
    const token = localStorage.getItem('token');
    console.log("Token: ", token);
    const resp = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',  // También puedes usar 'PATCH' si solo actualizas ciertos campos
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(producto),
    });

    if (!resp.ok) {
      throw new Error('Error al actualizar el producto');
    }

    const productoActualizado = await resp.json();
    return productoActualizado;
  }

  async eliminarProducto(id: number): Promise<void> {
    const resp = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!resp.ok) {
      throw new Error('Error al eliminar el producto');
    }

    return;  // No se espera ninguna respuesta del servidor al eliminar
  }

  async getProductosPorEmpresa(idEmpresa: number): Promise<Producto[]> {
    const resp = await fetch(`${this.apiUrl}?id_empresa=${idEmpresa}`);
    const productos = await resp.json();

    if (!resp.ok) {
      throw new Error('Error al obtener los productos por empresa');
    }

    return productos;
  }

  calcularPrecioDescuento(precio: number, descuento?: number): number {
    if (descuento) {
      return precio - (precio * (descuento / 100))
    }
    return precio;
  }
}
