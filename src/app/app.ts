import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Table } from './services/table.service';
import { MenuStateService } from './services/menu-state.service';
import { AuthComponent } from './components/auth/auth.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { ToastComponent } from './components/toast/toast.component';
import { TablesViewComponent } from './components/tables-view/tables-view.component';
import { PosViewComponent } from './components/pos-view/pos-view.component';
import { BillingViewComponent } from './components/billing-view/billing-view.component';

@Component({
  selector: 'app-root',
  imports: [
    AuthComponent,
    SidebarComponent,
    HeaderComponent,
    ToastComponent,
    TablesViewComponent,
    PosViewComponent,
    BillingViewComponent
  ],
  template: `
    @if (!authService.isAuthenticated()) {
      <app-auth></app-auth>
    } @else {
      <div class="flex h-screen bg-gray-50 font-sans text-gray-900">
        <app-sidebar
          [currentView]="currentView()"
          (changeView)="changeView($event)"
          (logout)="logout()">
        </app-sidebar>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <app-header [title]="viewTitle()"></app-header>

          <!-- Content Area -->
          <div class="flex-1 overflow-hidden flex flex-col relative">

            <app-toast></app-toast>

            @if (currentView() === 'tables') {
              <app-tables-view (openTable)="openTable($event)"></app-tables-view>
            } @else if (currentView() === 'pos' && activeTable()) {
              <app-pos-view [table]="activeTable()!" (close)="changeView('tables')"></app-pos-view>
            } @else if (currentView() === 'billing') {
              <app-billing-view (close)="changeView('tables')"></app-billing-view>
            }
          </div>
        </main>
      </div>
    }
  `
})
export class App implements OnInit {
  authService = inject(AuthService);
  private menuState = inject(MenuStateService);

  // --- ESTADO DE LA VISTA ---
  currentView = signal<'tables' | 'pos' | 'billing'>('tables');
  activeTable = signal<Table | null>(null);

  viewTitle = computed(() =>
    this.currentView() === 'tables' ? 'Gestión de Mesas' :
    this.currentView() === 'pos' ? 'Punto de Venta (POS)' :
    'Facturación y Cobro'
  );

  ngOnInit() {
    this.menuState.loadMenu();
  }

  logout() {
    this.authService.logout();
    this.currentView.set('tables');
    this.activeTable.set(null);
  }

  changeView(view: 'tables' | 'billing') {
    this.currentView.set(view);
    this.activeTable.set(null);
  }

  openTable(table: Table) {
    this.activeTable.set(table);
    this.currentView.set('pos');
  }
}
