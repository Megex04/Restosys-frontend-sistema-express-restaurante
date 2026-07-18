import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Table, TableService } from '../../services/table.service';
import { Bill, BillingService } from '../../services/billing.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-billing-view',
  imports: [CommonModule, MatIconModule],
  template: `
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
  `
})
export class BillingViewComponent implements OnInit {
  private tableService = inject(TableService);
  private billingService = inject(BillingService);
  private notification = inject(NotificationService);

  close = output<void>();

  tables = signal<Table[]>([]);
  occupiedTablesList = computed(() => this.tables().filter(t => t.status === 'occupied'));

  activeBillTable = signal<Table | null>(null);
  currentBill = signal<Bill | null>(null);
  isLoadingBill = signal(false);
  isSubmittingPayment = signal(false);

  ngOnInit() {
    this.loadTables();
  }

  loadTables() {
    this.tableService.getTables().subscribe({
      next: (data) => this.tables.set(data),
      error: (err) => console.error('Error fetching tables', err)
    });
  }

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
      next: () => {
        this.isSubmittingPayment.set(false);
        this.notification.show(`¡Pago procesado exitosamente! (${method})`);

        this.close.emit();
      },
      error: (err) => {
        console.error('Error processing payment', err);
        this.isSubmittingPayment.set(false);
      }
    });
  }
}
