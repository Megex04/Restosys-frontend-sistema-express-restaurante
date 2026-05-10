import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TableService, Table } from './services/table.service';
import { PosService, Category, Dish, OrderRequestDTO } from './services/pos.service';
import { BillingService, Bill } from './services/billing.service';
import { AuthService } from './services/auth.service';
import { AuthComponent } from './components/auth/auth.component';

interface CartItem {
  dish: Dish;
  quantity: number;
  notes: string;
  locked?: boolean; // true = item ya enviado a cocina
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, MatIconModule, AuthComponent],
  template: `
    @if (!authService.isAuthenticated()) {
      <app-auth></app-auth>
    } @else {
      <div class="flex h-screen bg-gray-50 font-sans text-gray-900">
        <!-- Sidebar -->
        <aside class="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col transition-all">
          <div class="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-center lg:justify-start gap-3">
            <div class="bg-orange-500 text-white p-2 rounded-lg flex-shrink-0">
              <mat-icon>restaurant</mat-icon>
            </div>
            <h1 class="text-xl font-bold tracking-tight hidden lg:block">RestoSys</h1>
          </div>
          <nav class="flex-1 p-4 space-y-2">
            <button (click)="changeView('tables')" 
                    class="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl font-medium transition-colors"
                    [class.bg-orange-50]="currentView() === 'tables'"
                    [class.text-orange-600]="currentView() === 'tables'"
                    [class.text-gray-600]="currentView() !== 'tables'"
                    [class.hover:bg-gray-50]="currentView() !== 'tables'">
              <mat-icon>grid_view</mat-icon> 
              <span class="hidden lg:block">Mesas</span>
            </button>
            <button (click)="changeView('billing')" 
                    class="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl font-medium transition-colors"
                    [class.bg-orange-50]="currentView() === 'billing'"
                    [class.text-orange-600]="currentView() === 'billing'"
                    [class.text-gray-600]="currentView() !== 'billing'"
                    [class.hover:bg-gray-50]="currentView() !== 'billing'">
              <mat-icon>receipt_long</mat-icon> 
              <span class="hidden lg:block">Facturación</span>
            </button>
          </nav>
          <div class="p-4 border-t border-gray-200">
            <button (click)="logout()" class="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
              <mat-icon>logout</mat-icon>
              <span class="hidden lg:block">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <header class="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center z-10">
            <h2 class="text-2xl font-semibold">
              {{ currentView() === 'tables' ? 'Gestión de Mesas' : currentView() === 'pos' ? 'Punto de Venta (POS)' : 'Facturación y Cobro' }}
            </h2>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                  {{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <div class="text-sm hidden sm:block">
                  <p class="font-medium capitalize">{{ authService.currentUser()?.username }}</p>
                  <p class="text-gray-500 text-xs">{{ authService.currentUser()?.role === 'ROLE_ADMIN' ? 'Administrador' : authService.currentUser()?.role === 'ROLE_CASHIER' ? 'Cajero' : 'Mesero' }}</p>
                </div>
              </div>
            </div>
          </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-hidden flex flex-col relative">
          
          <!-- Notificación Toast (Simulada) -->
          @if (showToast()) {
            <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50 animate-bounce">
              <mat-icon class="text-green-400">check_circle</mat-icon>
              <span class="font-medium">{{ toastMessage() }}</span>
            </div>
          }

          @if (currentView() === 'tables') {
            <!-- ============================== -->
            <!-- VISTA 1: GESTIÓN DE MESAS      -->
            <!-- ============================== -->
            <div class="flex-1 overflow-auto p-8">
              <!-- Stats -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-green-100 text-green-600 rounded-xl"><mat-icon>check_circle</mat-icon></div>
                    <div>
                      <p class="text-sm text-gray-500 font-medium">Disponibles</p>
                      <p class="text-2xl font-bold">{{ availableTables() }}</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-orange-100 text-orange-600 rounded-xl"><mat-icon>people</mat-icon></div>
                    <div>
                      <p class="text-sm text-gray-500 font-medium">Ocupadas</p>
                      <p class="text-2xl font-bold">{{ occupiedTables() }}</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-red-100 text-red-600 rounded-xl"><mat-icon>cleaning_services</mat-icon></div>
                    <div>
                      <p class="text-sm text-gray-500 font-medium">Por Limpiar</p>
                      <p class="text-2xl font-bold">{{ dirtyTables() }}</p>
                    </div>
                  </div>
                </div>
              </div>

              @if (isLoadingTables()) {
                <div class="flex justify-center items-center py-12">
                  <mat-icon class="animate-spin text-orange-500 text-4xl">refresh</mat-icon>
                </div>
              } @else {
                <!-- Tables Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  @for (table of tables(); track table.id) {
                    <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center aspect-square relative group"
                         [class.border-green-500]="table.status === 'available'"
                         [class.border-orange-500]="table.status === 'occupied'"
                         [class.border-red-500]="table.status === 'dirty'"
                         (click)="handleTableClick(table)">
                      
                      <div class="absolute top-4 right-4">
                        <span class="flex h-3 w-3 relative">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                [class.bg-green-400]="table.status === 'available'"
                                [class.bg-orange-400]="table.status === 'occupied'"
                                [class.bg-red-400]="table.status === 'dirty'"></span>
                          <span class="relative inline-flex rounded-full h-3 w-3"
                                [class.bg-green-500]="table.status === 'available'"
                                [class.bg-orange-500]="table.status === 'occupied'"
                                [class.bg-red-500]="table.status === 'dirty'"></span>
                        </span>
                      </div>

                      <mat-icon class="text-5xl mb-4 group-hover:scale-110 transition-transform" 
                                [class.text-green-500]="table.status === 'available'"
                                [class.text-orange-500]="table.status === 'occupied'"
                                [class.text-red-500]="table.status === 'dirty'">
                        table_restaurant
                      </mat-icon>
                      <h3 class="text-xl font-bold mb-1">Mesa {{ table.number }}</h3>
                      <p class="text-sm text-gray-500">{{ table.capacity }} personas</p>
                      
                      <button
                        type="button"
                        (click)="handleTableAction(table); $event.stopPropagation()"
                        class="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition hover:scale-105 active:scale-95"
                        [class.bg-green-100]="table.status === 'available'"
                        [class.text-green-700]="table.status === 'available'"
                        [class.bg-orange-100]="table.status === 'occupied'"
                        [class.text-orange-700]="table.status === 'occupied'"
                        [class.bg-red-100]="table.status === 'dirty'"
                        [class.text-red-700]="table.status === 'dirty'">
                        {{ table.status === 'available' ? 'Abrir POS' : table.status === 'occupied' ? 'Ver Orden' : 'Limpiar Mesa' }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          } @else if (currentView() === 'pos') {
            <!-- ============================== -->
            <!-- VISTA 2: PUNTO DE VENTA (POS)  -->
            <!-- ============================== -->
            <div class="flex-1 flex overflow-hidden">
              
              <!-- Izquierda: Menú de Platillos -->
              <div class="flex-1 flex flex-col bg-gray-50">
                <!-- Categorías -->
                <div class="p-4 bg-white border-b border-gray-200 flex gap-3 overflow-x-auto shadow-sm z-10">
                  @for(cat of categories(); track cat.id) {
                    <button (click)="selectedCategoryId.set(cat.id)" 
                            class="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap"
                            [class.bg-orange-500]="selectedCategoryId() === cat.id"
                            [class.text-white]="selectedCategoryId() === cat.id"
                            [class.shadow-md]="selectedCategoryId() === cat.id"
                            [class.bg-gray-100]="selectedCategoryId() !== cat.id"
                            [class.text-gray-600]="selectedCategoryId() !== cat.id"
                            [class.hover:bg-gray-200]="selectedCategoryId() !== cat.id">
                      <mat-icon>{{cat.icon}}</mat-icon> {{cat.name}}
                    </button>
                  }
                </div>
                
                <!-- Cuadrícula de Platillos -->
                @if (isLoadingMenu()) {
                  <div class="flex-1 flex justify-center items-center">
                    <mat-icon class="animate-spin text-orange-500 text-4xl">refresh</mat-icon>
                  </div>
                } @else if (menuError()) {
                  <div class="flex-1 flex flex-col justify-center items-center text-red-500 gap-3">
                    <mat-icon class="text-5xl">error</mat-icon>
                    <p class="font-bold">{{ menuError() }}</p>
                    <button (click)="loadMenu()" class="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold">
                      Reintentar
                    </button>
                  </div>
                } @else if (filteredDishes().length === 0) {
                  <div class="flex-1 flex flex-col justify-center items-center text-gray-400 gap-3">
                    <mat-icon class="text-6xl text-gray-300">restaurant_menu</mat-icon>
                    <p class="font-bold">No hay productos disponibles para esta categoría.</p>
                  </div>
                } @else {
                  <div class="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto content-start">
                    @for(dish of filteredDishes(); track dish.id) {
                      <div (click)="addToCart(dish)" 
                          class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-orange-500 hover:shadow-md transition-all flex flex-col items-center text-center group active:scale-95">
                        <div class="w-20 h-20 bg-gray-50 rounded-full mb-4 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                          {{ dish.imageIcon }}
                        </div>
                        <h4 class="font-bold text-gray-800 mb-1 leading-tight">{{ dish.name }}</h4>
                        <p class="text-orange-600 font-bold text-lg">S/ {{ dish.price | number:'1.2-2' }}</p>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Derecha: Ticket / Carrito -->
              <div class="w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20">
                <!-- Cabecera del Ticket -->
                <div class="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
                  <div>
                    <h3 class="text-xl font-black text-gray-800">Mesa {{activeTable()?.number}}</h3>
                    <p class="text-sm text-gray-500 font-medium">Tomando Orden</p>
                  </div>
                  <button (click)="changeView('tables')" class="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <!-- Lista de Items -->
                <div class="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                  @for(item of cart(); track $index) {
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-fade-in"
                        [class.opacity-75]="item.locked"
                        [class.border-blue-200]="item.locked"
                        [class.border-orange-300]="!item.locked">
                      <div class="flex justify-between items-start mb-3">
                        <div class="flex-1 pr-3">
                          <h5 class="font-bold text-gray-800 leading-tight">{{item.dish.name}}</h5>
                          <p class="text-orange-600 font-semibold text-sm">
                            S/ {{item.dish.price | number:'1.2-2'}} c/u
                          </p>

                          @if (item.locked) {
                            <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                              Ya enviado
                            </span>
                          } @else if (isExistingOrderView()) {
                            <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase">
                              Nuevo
                            </span>
                          }
                        </div>
                        <button
                          (click)="removeFromCart(item)"
                          [disabled]="item.locked"
                          class="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </div>
                      
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                          <button
                            (click)="updateQty(item, -1)"
                            [disabled]="item.locked"
                            class="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-600 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            -
                          </button>

                          <span class="w-10 text-center font-bold text-gray-800">{{item.quantity}}</span>

                          <button
                            (click)="updateQty(item, 1)"
                            [disabled]="item.locked"
                            class="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-600 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            +
                          </button>
                        </div>
                        <p class="font-black text-lg text-gray-800">\${{item.dish.price * item.quantity | number:'1.2-2'}}</p>
                      </div>

                      <div class="relative">
                        <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">edit_note</mat-icon>
                        <input type="text"
                          placeholder="Notas (ej. sin cebolla)"
                          class="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          [value]="item.notes"
                          [disabled]="item.locked"
                          (input)="updateNotes(item, $event)">
                      </div>
                    </div>
                  }
                  
                  @if(cart().length === 0) {
                    <div class="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                      <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                        <mat-icon class="text-5xl text-gray-300">shopping_cart</mat-icon>
                      </div>
                      <p class="font-medium text-center px-8">Toca los platillos a la izquierda para agregarlos a la orden</p>
                    </div>
                  }
                </div>

                <!-- Footer del Ticket (Totales y Botón Enviar) -->
                <div class="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                  <div class="flex justify-between items-center mb-2 text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span>\${{cartTotal() | number:'1.2-2'}}</span>
                  </div>
                  <div class="flex justify-between items-center mb-4 text-2xl font-black text-gray-800">
                    <span>Total</span>
                    <span class="text-orange-600">\${{cartTotal() | number:'1.2-2'}}</span>
                  </div>
                  
                  <!-- JSON Preview (Debug) -->
                  <div class="mb-4 p-3 bg-gray-900 rounded-lg overflow-hidden">
                    <p class="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">Payload JSON (OrderRequestDTO)</p>
                    <pre class="text-green-400 text-[10px] font-mono whitespace-pre-wrap overflow-y-auto max-h-32">{{ getOrderPayload() | json }}</pre>
                  </div>
                  
                  <button
                    (click)="isExistingOrderView() ? addItemsToExistingOrder() : sendOrder()"
                    [disabled]="isSubmitting() || (isExistingOrderView() ? !hasNewItems() : cart().length === 0)"
                    class="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all shadow-lg shadow-orange-500/30 active:scale-95">

                    @if (isSubmitting()) {
                      <mat-icon class="animate-spin">refresh</mat-icon>
                      {{ isExistingOrderView() ? 'Agregando productos...' : 'Enviando a Cocina...' }}
                    } @else if (isExistingOrderView()) {
                      <mat-icon>add_shopping_cart</mat-icon>
                      Agregar más productos
                    } @else {
                      <mat-icon>send</mat-icon>
                      Enviar a Cocina
                    }
                  </button>
                </div>
              </div>
            </div>
          } @else if (currentView() === 'billing') {
            <!-- ============================== -->
            <!-- VISTA 3: FACTURACIÓN Y COBRO   -->
            <!-- ============================== -->
            <div class="flex-1 flex overflow-hidden bg-gray-50 p-8 gap-8">
              
              <!-- Lista de Mesas Ocupadas -->
              <div class="w-1/3 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="p-5 border-b border-gray-200 bg-gray-50">
                  <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <mat-icon class="text-orange-500">receipt</mat-icon>
                    Cuentas Abiertas
                  </h3>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                  @for (table of occupiedTablesList(); track table.id) {
                    <div (click)="selectBillTable(table)"
                         class="p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center"
                         [class.border-orange-500]="activeBillTable()?.id === table.id"
                         [class.bg-orange-50]="activeBillTable()?.id === table.id"
                         [class.border-gray-100]="activeBillTable()?.id !== table.id"
                         [class.hover:border-gray-300]="activeBillTable()?.id !== table.id">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl">
                          {{table.number}}
                        </div>
                        <div>
                          <p class="font-bold text-gray-800">Mesa {{table.number}}</p>
                          <p class="text-sm text-gray-500">Ocupada</p>
                        </div>
                      </div>
                      <mat-icon class="text-gray-400">chevron_right</mat-icon>
                    </div>
                  }
                  @if (occupiedTablesList().length === 0) {
                    <div class="text-center py-12 text-gray-500">
                      <mat-icon class="text-4xl mb-2 text-gray-300">check_circle</mat-icon>
                      <p>No hay mesas ocupadas.</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Detalle de la Cuenta -->
              <div class="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                @if (isLoadingBill()) {
                  <div class="flex-1 flex justify-center items-center">
                    <mat-icon class="animate-spin text-orange-500 text-4xl">refresh</mat-icon>
                  </div>
                } @else if (currentBill()) {
                  <div class="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                      <h2 class="text-2xl font-black text-gray-800">Mesa {{activeBillTable()?.number}}</h2>
                      <p class="text-gray-500">Detalle de Consumo</p>
                    </div>
                    <div class="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-bold">
                      Total: \${{currentBill()!.total | number:'1.2-2'}}
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto p-6">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="border-b-2 border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                          <th class="pb-3 font-semibold">Cant.</th>
                          <th class="pb-3 font-semibold">Descripción</th>
                          <th class="pb-3 font-semibold text-right">P. Unitario</th>
                          <th class="pb-3 font-semibold text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody class="text-gray-700">
                        @for (item of currentBill()!.items; track $index) {
                          <tr class="border-b border-gray-100">
                            <td class="py-4 font-bold">{{item.quantity}}</td>
                            <td class="py-4">
                              <p class="font-bold">{{item.dish.name}}</p>
                              @if (item.notes) {
                                <p class="text-xs text-gray-500 italic mt-1">Nota: {{item.notes}}</p>
                              }
                            </td>
                            <td class="py-4 text-right">\${{item.dish.price | number:'1.2-2'}}</td>
                            <td class="py-4 text-right font-bold">\${{item.dish.price * item.quantity | number:'1.2-2'}}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="p-6 bg-gray-50 border-t border-gray-200">
                    <div class="flex justify-end mb-6">
                      <div class="w-64 space-y-2">
                        <div class="flex justify-between text-gray-600">
                          <span>Subtotal:</span>
                          <span class="font-medium">\${{currentBill()!.subtotal | number:'1.2-2'}}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                          <span>IVA (16%):</span>
                          <span class="font-medium">\${{currentBill()!.tax | number:'1.2-2'}}</span>
                        </div>
                        <div class="flex justify-between text-2xl font-black text-gray-800 pt-2 border-t border-gray-200">
                          <span>TOTAL:</span>
                          <span class="text-orange-600">\${{currentBill()!.total | number:'1.2-2'}}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex gap-4">
                      <button (click)="processPayment('CASH')" 
                              [disabled]="isSubmittingPayment()"
                              class="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-95 disabled:opacity-50">
                        <mat-icon>payments</mat-icon> Pago en Efectivo
                      </button>
                      <button (click)="processPayment('CARD')" 
                              [disabled]="isSubmittingPayment()"
                              class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50">
                        <mat-icon>credit_card</mat-icon> Pago con Tarjeta
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="flex-1 flex flex-col justify-center items-center text-gray-400">
                    <mat-icon class="text-6xl mb-4 text-gray-300">receipt_long</mat-icon>
                    <p class="text-lg font-medium">Selecciona una mesa ocupada a la izquierda</p>
                  </div>
                }
              </div>

            </div>
          }
        </div>
      </main>
    </div>
    }
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class App implements OnInit {
  private tableService = inject(TableService);
  private posService = inject(PosService);
  private billingService = inject(BillingService);
  authService = inject(AuthService);

  // --- ESTADO DE LA VISTA ---
  currentView = signal<'tables' | 'pos' | 'billing'>('tables');
  activeTable = signal<Table | null>(null);
  showToast = signal(false);
  toastMessage = signal('');

  // --- ESTADO DE MESAS ---
  tables = signal<Table[]>([]);
  isLoadingTables = signal(true);
  availableTables = computed(() => this.tables().filter(t => t.status === 'available').length);
  occupiedTables = computed(() => this.tables().filter(t => t.status === 'occupied').length);
  dirtyTables = computed(() => this.tables().filter(t => t.status === 'dirty').length);
  occupiedTablesList = computed(() => this.tables().filter(t => t.status === 'occupied'));

  // --- ESTADO DEL POS (MENÚ) ---
  categories = signal<Category[]>([]);
  dishes = signal<Dish[]>([]);
  selectedCategoryId = signal<number | null>(null);
  isLoadingMenu = signal(false);
  menuError = signal<string | null>(null);

  filteredDishes = computed(() => {
    const selectedId = this.selectedCategoryId();

    return this.dishes().filter(dish =>
      dish.available && selectedId !== null && dish.categoryId === selectedId
    );
  });
  
  // --- ESTADO DEL CARRITO (TICKET) ---
  cart = signal<CartItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((acc, item) => acc + (item.dish.price * item.quantity), 0));
  isSubmitting = signal(false);

  isAddingItemsToExistingOrder = signal(false);

  readonly isExistingOrderView = computed(() =>
    this.activeTable()?.status === 'occupied'
  );

  readonly hasNewItems = computed(() =>
    this.cart().some(item => !item.locked)
  );

  addItemsToExistingOrder() {
    const table = this.activeTable();
    const orderRequest = this.getOrderPayload();

    if (!table || !orderRequest || orderRequest.items.length === 0) {
      return;
    }

    this.isSubmitting.set(true);

    this.posService.addItemsToExistingOrder(table.id, orderRequest.items).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        this.toastMessage.set('Productos agregados a la orden correctamente');
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);

        this.changeView('tables');
      },
      error: (err) => {
        console.error('Error agregando productos a la orden existente', err);
        this.isSubmitting.set(false);
        alert('No se pudieron agregar los productos a la orden existente.');
      }
    });
  }

  // --- ESTADO DE FACTURACIÓN ---
  activeBillTable = signal<Table | null>(null);
  currentBill = signal<Bill | null>(null);
  isLoadingBill = signal(false);
  isSubmittingPayment = signal(false);

  ngOnInit() {
    this.loadTables();
    this.loadMenu();
  }

  logout() {
    this.authService.logout();
    this.currentView.set('tables');
    this.activeTable.set(null);
    this.activeBillTable.set(null);
    this.currentBill.set(null);
  }

  loadTables() {
    this.isLoadingTables.set(true);
    this.tableService.getTables().subscribe({
      next: (data) => {
        this.tables.set(data);
        this.isLoadingTables.set(false);
        
        // Si estamos en facturación y la mesa activa ya no está ocupada, la limpiamos
        if (this.currentView() === 'billing' && this.activeBillTable()) {
          const stillOccupied = data.find(t => t.id === this.activeBillTable()?.id && t.status === 'occupied');
          if (!stillOccupied) {
            this.activeBillTable.set(null);
            this.currentBill.set(null);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching tables', err);
        this.isLoadingTables.set(false);
      }
    });
  }

  loadMenu() {
    this.isLoadingMenu.set(true);
    this.menuError.set(null);

    this.posService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);

        if (categories.length > 0 && this.selectedCategoryId() === null) {
          this.selectedCategoryId.set(categories[0].id);
        }

        this.isLoadingMenu.set(false);
      },
      error: (err) => {
        console.error('Error fetching categories', err);
        this.menuError.set('No se pudieron cargar las categorías.');
        this.isLoadingMenu.set(false);
      }
    });

    this.posService.getDishes().subscribe({
      next: (dishes) => {
        console.log('PRODUCTOS CARGADOS:', dishes);
        this.dishes.set(dishes);
      },
      error: (err) => {
        console.error('Error fetching dishes', err);
        this.menuError.set('No se pudieron cargar los productos.');
      }
    });
  }

  changeView(view: 'tables' | 'pos' | 'billing') {
    this.currentView.set(view);
    if (view === 'tables') {
      this.activeTable.set(null);
      this.activeBillTable.set(null);
      this.currentBill.set(null);
      this.loadTables(); // Refrescar mesas al volver
    }
  }

  handleTableClick(table: Table) {
    if (table.status === 'dirty') {
      this.confirmCleanTable(table);
      return;
    }

    this.activeTable.set(table);
    this.currentView.set('pos');

    if (table.status === 'available') {
      this.cart.set([]);
      return;
    }

    if (table.status === 'occupied') {
      this.loadActiveOrderToCart(table.id);
      return;
    }
  }

  loadActiveOrderToCart(tableId: number) {
    this.cart.set([]);

    this.posService.getActiveOrderByTable(tableId).subscribe({
      next: (order) => {
        const items: CartItem[] = order.items.map(item => ({
          dish: {
            id: item.dish.id,
            name: item.dish.name,
            price: Number(item.dish.price),
            categoryId: item.dish.categoryId ?? item.dish.category_id ?? item.dish.category?.id ?? 0,
            available: item.dish.available ?? true,
            imageIcon: item.dish.imageIcon || '🍽️'
          },
          quantity: item.quantity,
          notes: item.notes || '',
          locked: true
        }));

        this.cart.set(items);
      },
      error: (err) => {
        console.error('Error cargando orden activa', err);
        alert('No se pudo cargar la orden activa de esta mesa.');
      }
    });
  }

  // --- LÓGICA DEL CARRITO ---
  
  addToCart(dish: Dish) {
    this.cart.update(items => {
      const existingEditable = items.find(i => i.dish.id === dish.id && !i.locked);

      if (existingEditable) {
        return items.map(i =>
          i.dish.id === dish.id && !i.locked
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [
        ...items,
        {
          dish,
          quantity: 1,
          notes: '',
          locked: false
        }
      ];
    });
  }

  updateQty(item: CartItem, delta: number) {
    if (item.locked) return;

    this.cart.update(items => items.map(i => {
      if (i.dish.id === item.dish.id && !i.locked) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }

      return i;
    }));
  }

  updateNotes(item: CartItem, event: Event) {
    if (item.locked) return;

    const notes = (event.target as HTMLInputElement).value;

    this.cart.update(items =>
      items.map(i =>
        i.dish.id === item.dish.id && !i.locked
          ? { ...i, notes }
          : i
      )
    );
  }

  removeFromCart(item: CartItem) {
    if (item.locked) return;

    this.cart.update(items =>
      items.filter(i => !(i.dish.id === item.dish.id && !i.locked))
    );
  }

  getOrderPayload(): OrderRequestDTO | null {
    const table = this.activeTable();
    if (!table) return null;

    const editableItems = this.cart().filter(item => !item.locked);

    return {
      tableId: table.id,
      items: editableItems.map(item => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        notes: item.notes
      }))
    };
  }

  sendOrder() {
    const table = this.activeTable();
    const orderRequest = this.getOrderPayload();
    if (!orderRequest || !table) return;

    this.isSubmitting.set(true);

    this.posService.submitOrder(orderRequest).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.changeView('tables');
        
        this.toastMessage.set('¡Orden enviada a cocina exitosamente!');
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);
      },
      error: (err) => {
        console.error('Error al enviar orden', err);
        this.isSubmitting.set(false);
      }
    });
  }

  // --- LÓGICA DE FACTURACIÓN ---

  selectBillTable(table: Table) {
    this.activeBillTable.set(table);
    this.isLoadingBill.set(true);
    this.billingService.getBillForTable(table.id).subscribe({
      next: (bill) => {
        this.currentBill.set(bill);
        this.isLoadingBill.set(false);
      },
      error: (err) => {
        console.error('Error fetching bill', err);
        this.isLoadingBill.set(false);
      }
    });
  }

  processPayment(method: string) {
    const table = this.activeBillTable();
    if (!table) return;

    this.isSubmittingPayment.set(true);
    this.billingService.processPayment(table.id, method).subscribe({
      next: (res) => {
        this.isSubmittingPayment.set(false);
        this.toastMessage.set(`¡Pago procesado exitosamente! (${method})`);
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3000);
        
        // Volver a la vista de mesas
        this.changeView('tables');
      },
      error: (err) => {
        console.error('Error processing payment', err);
        this.isSubmittingPayment.set(false);
      }
    });
  }

  handleTableAction(table: Table) {
    if (table.status === 'dirty') {
      this.confirmCleanTable(table);
      return;
    }

    this.handleTableClick(table);
  }

  confirmCleanTable(table: Table) {
    const confirmed = confirm(`¿Estás seguro de pasar la Mesa ${table.number} de dirty a available?`);

    if (!confirmed) {
      return;
    }

    this.cleanTable(table.id);
  }

  cleanTable(tableId: number) {
    this.tableService.updateTableStatus(tableId, 'available').subscribe({
      next: () => {
        this.loadTables();
        this.toastMessage.set('Mesa limpiada correctamente');
        this.showToast.set(true);

        setTimeout(() => {
          this.showToast.set(false);
        }, 2500);
      },
      error: (err) => {
        console.error('Error limpiando mesa', err);
        alert('No se pudo limpiar la mesa.');
      }
    });
  }
}
