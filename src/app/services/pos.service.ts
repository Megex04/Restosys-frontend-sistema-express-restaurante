import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface Dish {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  available: boolean;
  imageIcon: string;
}

export interface DishBackendResponse {
  id: number;
  name: string;
  price: number | string;
  available?: boolean;
  imageIcon?: string;
  categoryId?: number;
  category_id?: number;
  category?: {
    id: number;
    name?: string;
  };
}

export interface ActiveOrderItemResponse {
  id: number;
  quantity: number;
  notes: string;
  dish: DishBackendResponse;
}

export interface ActiveOrderResponse {
  id: number;
  status: string;
  totalAmount: number;
  items: ActiveOrderItemResponse[];
}

export interface OrderItemRequestDTO {
  dishId: number;
  quantity: number;
  notes: string;
}

export interface OrderRequestDTO {
  tableId: number;
  items: OrderItemRequestDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.baseUrl}/api`;

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/menu/categories`).pipe(
      map(categories =>
        categories.map(category => ({
          ...category,
          icon: category.icon || 'restaurant_menu'
        }))
      )
    );
  }

  getDishes(): Observable<Dish[]> {
    return this.http.get<DishBackendResponse[]>(`${this.apiUrl}/menu/dishes/available`).pipe(
      map(dishes =>
        dishes.map(dish => ({
          id: dish.id,
          name: dish.name,
          price: Number(dish.price),
          available: dish.available ?? true,
          imageIcon: dish.imageIcon || '🍽️',
          categoryId: dish.categoryId ?? dish.category_id ?? dish.category?.id ?? 0
        }))
      )
    );
  }

  submitOrder(order: OrderRequestDTO): Observable<any> {
    console.log('JSON ENVIADO AL BACKEND:', JSON.stringify(order, null, 2));
    return this.http.post(`${this.apiUrl}/orders`, order);
  }

  getActiveOrderByTable(tableId: number): Observable<ActiveOrderResponse> {
    return this.http.get<ActiveOrderResponse>(
      `${this.apiUrl}/orders/table/${tableId}/active`
    );
  }

  addItemsToExistingOrder(tableId: number, items: OrderItemRequestDTO[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/orders/table/${tableId}/items`,
      { items }
    );
  }
}