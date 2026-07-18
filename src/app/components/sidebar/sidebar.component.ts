import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  imports: [MatIconModule],
  template: `
    <aside class="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col transition-all">
      <div class="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-center lg:justify-start gap-3">
        <div class="bg-orange-500 text-white p-2 rounded-lg flex-shrink-0">
          <mat-icon>restaurant</mat-icon>
        </div>
        <h1 class="text-xl font-bold tracking-tight hidden lg:block">RestoSys</h1>
      </div>
      <nav class="flex-1 p-4 space-y-2">
        <button (click)="changeView.emit('tables')"
                class="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl font-medium transition-colors"
                [class.bg-orange-50]="currentView() === 'tables'"
                [class.text-orange-600]="currentView() === 'tables'"
                [class.text-gray-600]="currentView() !== 'tables'"
                [class.hover:bg-gray-50]="currentView() !== 'tables'">
          <mat-icon>grid_view</mat-icon>
          <span class="hidden lg:block">Mesas</span>
        </button>
        <button (click)="changeView.emit('billing')"
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
        <button (click)="logout.emit()" class="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
          <mat-icon>logout</mat-icon>
          <span class="hidden lg:block">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  currentView = input.required<'tables' | 'pos' | 'billing'>();
  changeView = output<'tables' | 'billing'>();
  logout = output<void>();
}
