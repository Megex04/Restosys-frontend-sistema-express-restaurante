import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface BillItem {
  dish: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  notes: string;
}

export interface Bill {
  tableId: number;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.baseUrl}/api/billing`;

  getBillForTable(tableId: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/table/${tableId}`);
  }

  processPayment(tableId: number, paymentMethod: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/table/${tableId}/pay`, { paymentMethod });
  }
}
