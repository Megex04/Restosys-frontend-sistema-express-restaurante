import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  imports: [MatIconModule],
  template: `
    @if (notification.showToast()) {
      <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50 animate-bounce">
        <mat-icon class="text-green-400">check_circle</mat-icon>
        <span class="font-medium">{{ notification.toastMessage() }}</span>
      </div>
    }
  `
})
export class ToastComponent {
  notification = inject(NotificationService);
}
