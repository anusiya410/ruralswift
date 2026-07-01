// src/app/services/cart.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService, CartItem, CartResponse } from './api.service';

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly baseUrl = 'http://localhost:3000/api';

  // Reactive signal-based cart state
  private _items = signal<CartItem[]>([]);
  private _loading = signal(false);

  readonly items   = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  constructor(private http: HttpClient, private api: ApiService) {}

  /** Load cart — from server if logged in, else from localStorage */
  load(): void {
    if (this.api.isLoggedIn()) {
      this._loading.set(true);
      this.http.get<any>(`${this.baseUrl}/cart`).subscribe({
        next: (res) => {
          this._items.set(res.data?.items ?? []);
          this._loading.set(false);
        },
        error: () => {
          this._loadFromStorage();
          this._loading.set(false);
        }
      });
    } else {
      this._loadFromStorage();
    }
  }

  addItem(productId: number, quantity: number = 1): void {
    if (this.api.isLoggedIn()) {
      this.http.post<any>(`${this.baseUrl}/cart`, { product_id: productId, quantity }).subscribe({
        next: () => this.load(),
        error: (e) => console.error('[CartService] addItem error', e)
      });
    } else {
      const items = this._items();
      const existing = items.find(i => i.product_id === productId);
      if (existing) {
        this._items.set(items.map(i =>
          i.product_id === productId ? { ...i, quantity: i.quantity + quantity } : i
        ));
      } else {
        // For guest users, add a minimal cart item with product_id only
        this._items.set([...items, {
          id: Date.now(), product_id: productId, quantity,
          name: 'Product', price: 0, mrp: 0, image_url: '', stock: 99, unit: 'piece'
        }]);
      }
      this._saveToStorage();
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) { this.removeItem(productId); return; }

    if (this.api.isLoggedIn()) {
      this.http.put<any>(`${this.baseUrl}/cart/${productId}`, { quantity }).subscribe({
        next: () => this.load(),
        error: (e) => console.error('[CartService] updateQty error', e)
      });
    } else {
      this._items.set(this._items().map(i =>
        i.product_id === productId ? { ...i, quantity } : i
      ));
      this._saveToStorage();
    }
  }

  removeItem(productId: number): void {
    if (this.api.isLoggedIn()) {
      this.http.delete<any>(`${this.baseUrl}/cart/${productId}`).subscribe({
        next: () => this.load(),
        error: (e) => console.error('[CartService] removeItem error', e)
      });
    } else {
      this._items.set(this._items().filter(i => i.product_id !== productId));
      this._saveToStorage();
    }
  }

  clear(): void {
    if (this.api.isLoggedIn()) {
      this.http.delete<any>(`${this.baseUrl}/cart`).subscribe({
        next: () => { this._items.set([]); },
        error: (e) => console.error('[CartService] clear error', e)
      });
    } else {
      this._items.set([]);
      localStorage.removeItem('cart');
    }
  }

  private _loadFromStorage(): void {
    try {
      const raw = localStorage.getItem('cart');
      this._items.set(raw ? JSON.parse(raw) : []);
    } catch {
      this._items.set([]);
    }
  }

  private _saveToStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this._items()));
    } catch { /* ignore */ }
  }
}
