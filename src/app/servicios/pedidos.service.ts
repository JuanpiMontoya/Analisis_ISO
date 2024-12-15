// pedidos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from '../interfaces/pedido';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private apiUrl = 'https://proyecto-taller-sis-info-grupo-1.onrender.com/pedidos';  // URL de tu API

  constructor(private http: HttpClient) {}

  // Obtiene los pedidos de un negocio por su id
  obtenerPedidosPorNegocio(id_negocio: number): Observable<Pedido[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id_negocio}`);
  }
}
