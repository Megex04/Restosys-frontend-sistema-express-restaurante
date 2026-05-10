import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="bg-orange-500 p-8 text-center text-white">
          <div class="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4 backdrop-blur-sm">
            <mat-icon class="text-4xl">restaurant</mat-icon>
          </div>
          <h1 class="text-3xl font-black tracking-tight">RestoSys</h1>
          <p class="text-orange-100 mt-2 font-medium">Sistema de Punto de Venta</p>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200">
          <button (click)="mode.set('pin')" 
                  class="flex-1 py-4 font-bold text-sm transition-colors"
                  [class.text-orange-600]="mode() === 'pin'"
                  [class.border-b-2]="mode() === 'pin'"
                  [class.border-orange-500]="mode() === 'pin'"
                  [class.text-gray-500]="mode() !== 'pin'">
            Acceso PIN
          </button>
          <button (click)="mode.set('login')" 
                  class="flex-1 py-4 font-bold text-sm transition-colors"
                  [class.text-orange-600]="mode() === 'login'"
                  [class.border-b-2]="mode() === 'login'"
                  [class.border-orange-500]="mode() === 'login'"
                  [class.text-gray-500]="mode() !== 'login'">
            Credenciales
          </button>
        </div>

        <div class="p-8">
          @if (errorMsg()) {
            <div class="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
              <mat-icon class="text-red-500">error</mat-icon>
              {{ errorMsg() }}
            </div>
          }

          <!-- PIN MODE -->
          @if (mode() === 'pin') {
            <div class="flex flex-col items-center animate-fade-in">
              <p class="text-gray-500 font-medium mb-6 text-center">Ingresa tu PIN de 4 dígitos</p>
              
              <!-- PIN Display -->
              <div class="flex gap-4 mb-8">
                @for (i of [0,1,2,3]; track i) {
                  <div class="w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all"
                       [class.border-orange-500]="pin().length > i"
                       [class.border-gray-200]="pin().length <= i"
                       [class.bg-orange-50]="pin().length > i">
                    {{ pin().length > i ? '•' : '' }}
                  </div>
                }
              </div>

              <!-- Numpad -->
              <div class="grid grid-cols-3 gap-4 w-full max-w-[240px]">
                @for (n of [1,2,3,4,5,6,7,8,9]; track n) {
                  <button (click)="addPin(n.toString())" class="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 text-xl font-bold text-gray-800 transition-colors active:scale-95">
                    {{ n }}
                  </button>
                }
                <button (click)="clearPin()" class="h-14 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors active:scale-95 flex items-center justify-center">
                  <mat-icon>backspace</mat-icon>
                </button>
                <button (click)="addPin('0')" class="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 text-xl font-bold text-gray-800 transition-colors active:scale-95">
                  0
                </button>
                <button (click)="submitPin()" [disabled]="pin().length !== 4 || isLoading()" class="h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors active:scale-95 flex items-center justify-center disabled:opacity-50">
                  @if (isLoading()) {
                    <mat-icon class="animate-spin">refresh</mat-icon>
                  } @else {
                    <mat-icon>login</mat-icon>
                  }
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-6 text-center">Admin PIN: 1234 | Mesero PIN: 1111</p>
            </div>
          }

          <!-- LOGIN MODE -->
          @if (mode() === 'login') {
            <form (ngSubmit)="submitLogin()" class="flex flex-col gap-5 animate-fade-in">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
                <div class="relative">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</mat-icon>
                  <input type="text" [(ngModel)]="username" name="username" required
                         class="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                         placeholder="Ej. admin">
                </div>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <div class="relative">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</mat-icon>
                  <input type="password" [(ngModel)]="password" name="password" required
                         class="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                         placeholder="••••••••">
                </div>
              </div>
              <button type="submit" [disabled]="isLoading() || !username() || !password()" 
                      class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg mt-2 transition-all shadow-lg shadow-orange-500/30 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                @if (isLoading()) {
                  <mat-icon class="animate-spin">refresh</mat-icon> Iniciando...
                } @else {
                  Ingresar
                }
              </button>
              <div class="text-center mt-2">
                <button type="button" (click)="mode.set('register')" class="text-sm font-bold text-orange-600 hover:underline">
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </form>
          }

          <!-- REGISTER MODE -->
          @if (mode() === 'register') {
            <form (ngSubmit)="submitRegister()" class="flex flex-col gap-4 animate-fade-in">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
                <input type="text" [(ngModel)]="username" name="username" required
                       class="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <input type="password" [(ngModel)]="password" name="password" required
                       class="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">PIN (4 dígitos)</label>
                  <input type="text" [(ngModel)]="regPin" name="regPin" maxlength="4" required
                         class="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-center tracking-widest font-bold">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Rol</label>
                  <select [(ngModel)]="role" name="role" class="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                    <option value="ROLE_WAITER">Mesero</option>
                    <option value="ROLE_CASHIER">Cajero</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" [disabled]="isLoading() || !username() || !password() || !regPin()" 
                      class="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-lg mt-2 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                @if (isLoading()) {
                  <mat-icon class="animate-spin">refresh</mat-icon> Registrando...
                } @else {
                  Crear Cuenta
                }
              </button>
              <div class="text-center mt-2">
                <button type="button" (click)="mode.set('login')" class="text-sm font-bold text-gray-500 hover:underline">
                  Volver al Login
                </button>
              </div>
            </form>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AuthComponent {
  private authService = inject(AuthService);

  mode = signal<'pin' | 'login' | 'register'>('pin');
  isLoading = signal(false);
  errorMsg = signal('');

  // PIN State
  pin = signal('');

  // Form State
  username = signal('');
  password = signal('');
  regPin = signal('');
  role = signal('ROLE_WAITER');

  addPin(num: string) {
    if (this.pin().length < 4) {
      this.pin.update(p => p + num);
      this.errorMsg.set('');
    }
  }

  clearPin() {
    this.pin.update(p => p.slice(0, -1));
  }

  submitPin() {
    if (this.pin().length !== 4) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.authService.loginWithPin(this.pin()).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set('PIN incorrecto o error de conexión');
        this.pin.set('');
      }
    });
  }

  submitLogin() {
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.authService.login({ username: this.username(), password: this.password() }).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set('Credenciales inválidas');
      }
    });
  }

  submitRegister() {
    this.isLoading.set(true);
    this.errorMsg.set('');

    const data = {
      username: this.username(),
      password: this.password(),
      pin: this.regPin(),
      role: this.role()
    };

    this.authService.register(data).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set('Error al registrar usuario');
      }
    });
  }
}
