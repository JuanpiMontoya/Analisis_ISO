import { Routes,RouterModule } from '@angular/router';
import { InicioComponent } from './paginas/inicio/inicio.component'; // Componente inicio
import { ListaProductosComponent } from './paginas/lista-productos/lista-productos.component';
import { ListaEmpresasComponent } from './paginas/lista-empresas/lista-empresas.component';
import { PaginaNoEncontradaComponent } from './paginas/pagina-no-encontrada/pagina-no-encontrada.component'; // Componente pág. no encontrada
import { RegistrarseComponent } from './paginas/registrarse/registrarse.component';
import { IniciarSesionComponent } from './paginas/iniciar-sesion/iniciar-sesion.component';
import { TerminosCondicionesComponent } from './paginas/terminos-condiciones/terminos-condiciones.component';
import { DetallesEmpresaComponent } from './paginas/detalles-empresa/detalles-empresa.component';
import { DetalleProductoComponent } from './paginas/detalle-producto/detalle-producto.component';
import { CarritoComponent } from './paginas/carrito/carrito.component';
import { PagoTarjetaComponent } from './paginas/pago-tarjeta/pago-tarjeta.component';
import { EditarProductoComponent } from './paginas/editar-producto/editar-producto.component';
import { EditarCuentaComponent } from './paginas/editar-cuenta/editar-cuenta.component';
import { MisionVisionComponent } from './paginas/mision-vision/mision-vision.component';
import { DetalleNegocioComponent } from './paginas/detalle-negocio/detalle-negocio.component';
import { InvoiceComponent } from './paginas/invoice/invoice.component';
import { PedidosNegocioComponent } from './paginas/pedidos-negocio/pedidos-negocio.component';
import { VerificarOTPComponent } from './paginas/verificar-otp/verificar-otp.component';


export const routes: Routes = [
    { path: 'inicio', component: InicioComponent },
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: 'productos', component: ListaProductosComponent },
    { path: 'productos/:id', component: ListaProductosComponent },
    { path: 'empresas', component: ListaEmpresasComponent },
    { path: 'registrarse', component: RegistrarseComponent },
    { path: 'iniciar-sesion', component: IniciarSesionComponent },
    { path: 'verificar-otp', component: VerificarOTPComponent },
    { path: 'terminos-condiciones', component: TerminosCondicionesComponent },
    { path: 'mision-vision', component: MisionVisionComponent },
    { path: 'detalles-empresa/:id', component: DetallesEmpresaComponent},
    { path: 'detalles-producto/:id', component: DetalleProductoComponent },
    { path: 'productos/editar/:id', component: EditarProductoComponent },
    { path: 'carrito', component: CarritoComponent},
    { path: 'detalle-negocio/:id', component: DetalleNegocioComponent},
    {path: 'pago-tarjeta',component:PagoTarjetaComponent},
    { path: 'editar-cuenta', component: EditarCuentaComponent },
    { path: 'invoice', component: InvoiceComponent },
    { path: 'pedidos-negocio/:id', component: PedidosNegocioComponent },
    { path: '**', component: PaginaNoEncontradaComponent },
];
