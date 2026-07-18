import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Table, TableService } from '../../services/table.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-tables-view',
  imports: [CommonModule, MatIconModule],
  template: `
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
  `
})
export class TablesViewComponent implements OnInit {
  private tableService = inject(TableService);
  private notification = inject(NotificationService);

  openTable = output<Table>();

  tables = signal<Table[]>([]);
  isLoadingTables = signal(true);
  availableTables = computed(() => this.tables().filter(t => t.status === 'available').length);
  occupiedTables = computed(() => this.tables().filter(t => t.status === 'occupied').length);
  dirtyTables = computed(() => this.tables().filter(t => t.status === 'dirty').length);

  ngOnInit() {
    this.loadTables();
  }

  loadTables() {
    this.isLoadingTables.set(true);
    this.tableService.getTables().subscribe({
      next: (data) => {
        this.tables.set(data);
        this.isLoadingTables.set(false);
      },
      error: (err) => {
        console.error('Error fetching tables', err);
        this.isLoadingTables.set(false);
      }
    });
  }

  handleTableClick(table: Table) {
    if (table.status === 'dirty') {
      this.confirmCleanTable(table);
      return;
    }

    this.openTable.emit(table);
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
        this.notification.show('Mesa limpiada correctamente', 2500);
      },
      error: (err) => {
        console.error('Error limpiando mesa', err);
        alert('No se pudo limpiar la mesa.');
      }
    });
  }
}
