import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  showToast = signal(false);
  toastMessage = signal('');

  show(message: string, duration = 3000) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), duration);
  }
}
