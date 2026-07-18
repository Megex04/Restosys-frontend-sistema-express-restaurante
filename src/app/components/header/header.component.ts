import { Component, inject, input } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  template: `
    <header class="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center z-10">
      <h2 class="text-2xl font-semibold">
        {{ title() }}
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
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  title = input.required<string>();
}
