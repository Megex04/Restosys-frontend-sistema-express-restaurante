import { Injectable, inject, signal } from '@angular/core';
import { Category, Dish, PosService } from './pos.service';

@Injectable({
  providedIn: 'root'
})
export class MenuStateService {
  private posService = inject(PosService);
  private loaded = false;

  categories = signal<Category[]>([]);
  dishes = signal<Dish[]>([]);
  isLoadingMenu = signal(false);
  menuError = signal<string | null>(null);

  loadMenu(force = false) {
    if (this.loaded && !force) return;
    this.loaded = true;

    this.isLoadingMenu.set(true);
    this.menuError.set(null);

    this.posService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
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
}
