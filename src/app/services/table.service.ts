import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface Table {
  id: number;
  number: string;
  status: 'available' | 'occupied' | 'dirty';
  capacity: number;
}

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.baseUrl}/api/tables`;

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }

  updateTableStatus(id: number, status: Table['status']): Observable<Table> {
    return this.http.patch<Table>(`${this.apiUrl}/${id}/status`, { status });
  }
}
