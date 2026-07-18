import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Dish, OrderRequestDTO, PosService } from '../../services/pos.service';
import { Table } from '../../services/table.service';
import { MenuStateService } from '../../services/menu-state.service';
import { NotificationService } from '../../services/notification.service';

interface CartItem {
  dish: Dish;
  quantity: number;
  notes: string;
  locked?: boolean; // true = item ya enviado a cocina
}

@Component({
  selector: 'app-pos-view',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex-1 flex overflow-hidden">

      <!-- Izquierda: Menú de Platillos -->
      <div class="flex-1 flex flex-col bg-gray-50">
        <!-- Categorías -->
        <div class="p-4 bg-white border-b border-gray-200 flex gap-3 overflow-x-auto shadow-sm z-10">
          @for(cat of menuState.categories(); track cat.id) {
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
        @if (menuState.isLoadingMenu()) {
          <div class="flex-1 flex justify-center items-center">
            <mat-icon class="animate-spin text-orange-500 text-4xl">refresh</mat-icon>
          </div>
        } @else if (menuState.menuError()) {
          <div class="flex-1 flex flex-col justify-center items-center text-red-500 gap-3">
            <mat-icon class="text-5xl">error</mat-icon>
            <p class="font-bold">{{ menuState.menuError() }}</p>
            <button (click)="menuState.loadMenu(true)" class="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold">
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
            <h3 class="text-xl font-black text-gray-800">Mesa {{table().number}}</h3>
            <p class="text-sm text-gray-500 font-medium">Tomando Orden</p>
          </div>
          <button (click)="close.emit()" class="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
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
export class PosViewComponent implements OnInit {
  private posService = inject(PosService);
  private notification = inject(NotificationService);
  menuState = inject(MenuStateService);

  table = input.required<Table>();
  close = output<void>();

  selectedCategoryId = signal<number | null>(null);

  filteredDishes = computed(() => {
    const selectedId = this.selectedCategoryId();

    return this.menuState.dishes().filter(dish =>
      dish.available && selectedId !== null && dish.categoryId === selectedId
    );
  });

  // --- ESTADO DEL CARRITO (TICKET) ---
  cart = signal<CartItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((acc, item) => acc + (item.dish.price * item.quantity), 0));
  isSubmitting = signal(false);

  readonly isExistingOrderView = computed(() =>
    this.table().status === 'occupied'
  );

  readonly hasNewItems = computed(() =>
    this.cart().some(item => !item.locked)
  );

  constructor() {
    effect(() => {
      const categories = this.menuState.categories();
      if (categories.length > 0 && this.selectedCategoryId() === null) {
        this.selectedCategoryId.set(categories[0].id);
      }
    });
  }

  ngOnInit() {
    this.menuState.loadMenu();

    const table = this.table();
    if (table.status === 'occupied') {
      this.loadActiveOrderToCart(table.id);
    } else {
      this.cart.set([]);
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
    const table = this.table();
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
    const orderRequest = this.getOrderPayload();
    if (!orderRequest) return;

    this.isSubmitting.set(true);

    this.posService.submitOrder(orderRequest).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        this.notification.show('¡Orden enviada a cocina exitosamente!');
        this.close.emit();
      },
      error: (err) => {
        console.error('Error al enviar orden', err);
        this.isSubmitting.set(false);
      }
    });
  }

  // --- LÓGICA DE ORDEN EXISTENTE ---

  addItemsToExistingOrder() {
    const table = this.table();
    const orderRequest = this.getOrderPayload();

    if (!orderRequest || orderRequest.items.length === 0) {
      return;
    }

    this.isSubmitting.set(true);

    this.posService.addItemsToExistingOrder(table.id, orderRequest.items).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        this.notification.show('Productos agregados a la orden correctamente');
        this.close.emit();
      },
      error: (err) => {
        console.error('Error agregando productos a la orden existente', err);
        this.isSubmitting.set(false);
        alert('No se pudieron agregar los productos a la orden existente.');
      }
    });
  }
}
