import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../interfaces/producto';

@Injectable({
  providedIn: 'root'
})

export class CarritoService {
  private carritoCount = new BehaviorSubject<number>(0);
  carritoCount$ = this.carritoCount.asObservable();

  private carritoItems: { [id_producto: number]: { producto: Producto, cantidad: number } } = {};

  private apiUrl = 'https://proyecto-taller-sis-info-grupo-1.onrender.com';

  constructor() {
    this.cargarCarritoDesdeStorage();
  }

  private guardarCarritoEnStorage() {
    sessionStorage.setItem('carrito', JSON.stringify(this.carritoItems));
  }

  private cargarCarritoDesdeStorage() {
    const carritoGuardado = sessionStorage.getItem('carrito');
    if (carritoGuardado) {
      this.carritoItems = JSON.parse(carritoGuardado);
      this.carritoCount.next(Object.values(this.carritoItems).reduce((total, item) => total + item.cantidad, 0));
    }
  }

  agregarAlCarrito(producto: Producto) {
    const itemExistente = this.carritoItems[producto.id_producto];

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      this.carritoItems[producto.id_producto] = { producto: producto, cantidad: 1 };
    }

    const totalProductos = this.carritoCount.value + 1;
    this.carritoCount.next(totalProductos);
    this.guardarCarritoEnStorage();
  }

  eliminarDelCarrito(id_producto: number) {
    const itemExistente = this.carritoItems[id_producto];
    if (itemExistente) {
      const totalProductos = this.carritoCount.value - itemExistente.cantidad;
      this.carritoCount.next(totalProductos);

      delete this.carritoItems[id_producto];
      this.guardarCarritoEnStorage();
    }
  }

  vaciarCarrito() {
    this.carritoItems = {};
    this.carritoCount.next(0);
    this.guardarCarritoEnStorage();
  }

  getProductosCarrito(): { producto: Producto, cantidad: number }[] {
    return Object.values(this.carritoItems);
  }

  getTotal(): number {
    return Object.values(this.carritoItems).reduce((total, item) =>
      total + (item.producto.precio * item.cantidad), 0);
  }

  async actualizarProductoEnCarrito(id_producto: number, nuevaCantidad: number, id_usuario: number): Promise<void> {
    const itemExistente = this.carritoItems[id_producto];
    if (itemExistente) {
      const diferencia = nuevaCantidad - itemExistente.cantidad;
      itemExistente.cantidad = nuevaCantidad;
      this.carritoItems[id_producto].cantidad = nuevaCantidad;
      const totalProductos = this.carritoCount.value + diferencia;
      this.carritoCount.next(totalProductos);

      this.guardarCarritoEnStorage();

      try {
        const response = await fetch(`${this.apiUrl}/carritos/actualizar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_usuario,
            id_producto,
            cantidad: nuevaCantidad,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al actualizar el carrito: ${response.statusText}`);
        }

        console.log('Cantidad actualizada en el backend');
      } catch (error) {
        console.error('Error al actualizar el carrito en el backend:', error);
      }
    }
  }

  async agregarProductoAlCarrito(producto: Producto, id_usuario: number): Promise<void> {
    if (this.carritoItems[producto.id_producto]) {
      console.error('El producto ya existe en el carrito, considera usar actualizar.');
      return;
    }

    this.carritoItems[producto.id_producto] = {
      producto: producto,
      cantidad: 1,
    };

    try {
      const response = await fetch(`${this.apiUrl}/carritos/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario,
          'id_producto': producto.id_producto,
          cantidad: 1,
        }),
      });
      console.log('response: ', response);
      if (!response.ok) {
        throw new Error(`Error al añadir producto al carrito en el backend: ${response.statusText}`);
      }

      console.log("producto añadido al carrito en backend");
      const totalProductos = this.carritoCount.value + 1;
      this.carritoCount.next(totalProductos);
    } catch (error) {
      console.error('Error al añadir producto al carrito en backend', error);
    }

  }

  private orderDetails: any;

  setOrderDetails(details: any) {
    this.orderDetails = details;
  }

  getOrderDetails() {
    return this.orderDetails;
  }

  private nombreCliente: string = '';

  setNombreCliente(nombre: string) {
    this.nombreCliente = nombre;
  }

  getNombreCliente(): string {
    return this.nombreCliente;
  }

  private nitCi: string = '';

  setNitCi(nitCi: string) {
    this.nitCi = nitCi;
  }

  getNitCi(): string {
    return this.nitCi;
  }

  async crearPedido(id_negocio: number): Promise<any> {
    const productos = this.getProductosCarrito().map(item => ({
      id_producto: item.producto.id_producto,
      cantidad: item.cantidad,
      precio: item.producto.precio
    }));

    const pedido = { id_negocio, productos };

    try {
      const response = await fetch(`${this.apiUrl}/pedidos/nuevo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pedido)
      });

      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error; // Relanzar el error para que el componente lo maneje
    }
  }

  async cargarCarritoDesdeBackend(id_usuario: number): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/carritos/${id_usuario}`);
      if (!response.ok) {
        throw new Error(`Error al cargar el carrito: ${response.statusText}`);
      }

      const carritoBackend = await response.json();
      console.log('Carrito recuperado del backend:', carritoBackend);

      // Sincronizar con el estado local
      this.carritoItems = {};
      let totalProductos = 0;

      carritoBackend.forEach((item: any) => {
        this.carritoItems[item.id_producto] = {
          producto: {
            id_producto: item.id_producto,
            id_empresa: item.id_empresa,
            nombre: item.nombre,
            descripcion: item.descripcion,
            precio: item.precio,
            imagen_url: item.imagen_url,
            descuento: item.descuento
          },
          cantidad: item.cantidad,
        };
        totalProductos += item.cantidad;
      });

      this.carritoCount.next(totalProductos);
      this.guardarCarritoEnStorage();
    } catch (error) {
      console.error('Error al recuperar el carrito desde el backend:', error);
    }
  }

}
