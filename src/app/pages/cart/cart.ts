import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

interface CartItem {
  id: number;
  name: string;
  volume: string;
  price: number;
  quantity: number;
  image: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent {
  cartItems: CartItem[] = [
    {
      id: 1,
      name: 'Herbal Cough Syrup',
      volume: '100ml',
      price: 120,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80'
    },
    {
      id: 2,
      name: 'Premium Basmati Rice',
      volume: '5kg',
      price: 250,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b7f4?w=200&q=80'
    },
    {
      id: 3,
      name: 'Mineral Water Bottle',
      volume: '1L',
      price: 150,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&q=80'
    }
  ];

  updateQuantity(id: number, delta: number): void {
    this.cartItems = this.cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
  }

  removeItem(id: number): void {
    this.cartItems = this.cartItems.filter(item => item.id !== id);
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get shipping(): number {
    return this.subtotal > 0 ? 40 : 0;
  }

  get urgentCharge(): number {
    return this.subtotal > 0 ? 60 : 0;
  }

  get total(): number {
    return this.subtotal + this.shipping + this.urgentCharge;
  }
}
