import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'Active' | 'Out of Stock' | 'Low Stock';
}

interface SellerOrder {
  id: string;
  date: string;
  customer: string;
  item: string;
  amount: number;
  status: 'Pending Shipment' | 'Shipped' | 'Delivered';
}

@Component({
  selector: 'app-seller-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './seller-hub.html',
  styleUrl: './seller-hub.css'
})
export class SellerHubComponent {

  // ── Auth ─────────────────────────────────────────────────────
  isAuthenticated = false;
  isLoginMode = true;
  authLoading = false;
  authError = '';

  // ── Sidebar drawer (mobile) ───────────────────────────────────
  sidebarOpen = false;

  // ── Dashboard tab state ───────────────────────────────────────
  activeTab: 'dashboard' | 'inventory' | 'add-product' | 'orders' | 'analytics' | 'settings' = 'dashboard';

  // ── Stats ─────────────────────────────────────────────────────
  stats = {
    totalSales: 45800,
    activeOrders: 12,
    productsListed: 34,
    lowStock: 3
  };

  // ── Inventory ─────────────────────────────────────────────────
  inventory: InventoryItem[] = [
    { id: 'SKU001', name: 'Herbal Cough Syrup 100ml', category: 'Medicine', price: 120, stock: 45, status: 'Active' },
    { id: 'SKU002', name: 'Premium Basmati Rice 5kg', category: 'Grocery', price: 250, stock: 12, status: 'Active' },
    { id: 'SKU003', name: 'Mineral Water Bottle 1L', category: 'Home & Kitchen', price: 150, stock: 0, status: 'Out of Stock' },
    { id: 'SKU004', name: 'Neem Organic Fertilizer 1kg', category: 'Farming', price: 90, stock: 5, status: 'Low Stock' },
    { id: 'SKU005', name: 'LED Solar Lantern', category: 'Electronics', price: 550, stock: 22, status: 'Active' },
  ];

  inventorySearch = '';
  get filteredInventory(): InventoryItem[] {
    if (!this.inventorySearch.trim()) return this.inventory;
    const q = this.inventorySearch.toLowerCase();
    return this.inventory.filter(i =>
      i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }

  // ── Orders ────────────────────────────────────────────────────
  sellerOrders: SellerOrder[] = [
    { id: 'ORD12345', date: '10 Jun 2026', customer: 'Priya Sharma', item: 'Herbal Cough Syrup', amount: 120, status: 'Pending Shipment' },
    { id: 'ORD12312', date: '09 Jun 2026', customer: 'Ramesh Singh', item: 'Premium Basmati Rice 5kg', amount: 500, status: 'Shipped' },
    { id: 'ORD11998', date: '08 Jun 2026', customer: 'Sunita Devi', item: 'LED Solar Lantern', amount: 550, status: 'Delivered' },
  ];

  // ── New product form ──────────────────────────────────────────
  newProduct = {
    title: '', brand: '', description: '', category: '',
    price: null as number | null,
    stock: null as number | null,
    weight: null as number | null
  };
  productSubmitSuccess = false;

  // ── Auth form model ───────────────────────────────────────────
  authForm = {
    fullName: '', businessName: '', gstNumber: '', phone: '',
    businessAddress: '', email: '', password: '', terms: false
  };

  // ── Sidebar methods ───────────────────────────────────────────
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    document.body.style.overflow = this.sidebarOpen ? 'hidden' : '';
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    document.body.style.overflow = '';
  }

  setTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    this.closeSidebar();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeSidebar(); }

  // ── Auth ─────────────────────────────────────────────────────
  handleAuth(event: Event): void {
    event.preventDefault();
    this.authError = '';
    this.authLoading = true;
    // Simulate API call — will be replaced with real API in phase 10
    setTimeout(() => {
      this.authLoading = false;
      this.isAuthenticated = true;
    }, 600);
  }

  logout(): void {
    this.isAuthenticated = false;
    this.isLoginMode = true;
    this.activeTab = 'dashboard';
    this.authForm = { fullName: '', businessName: '', gstNumber: '', phone: '', businessAddress: '', email: '', password: '', terms: false };
  }

  // ── Product ───────────────────────────────────────────────────
  submitProduct(event: Event): void {
    event.preventDefault();
    this.productSubmitSuccess = false;
    // Simulate submission
    setTimeout(() => {
      this.productSubmitSuccess = true;
      setTimeout(() => {
        this.productSubmitSuccess = false;
        this.activeTab = 'inventory';
        this.newProduct = { title: '', brand: '', description: '', category: '', price: null, stock: null, weight: null };
      }, 1500);
    }, 500);
  }

  // ── Helpers ───────────────────────────────────────────────────
  getStockDotClass(stock: number): string {
    if (stock === 0) return 'dot-red';
    if (stock < 10) return 'dot-orange';
    return 'dot-green';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':           return 'badge-green';
      case 'Out of Stock':     return 'badge-red';
      case 'Low Stock':        return 'badge-orange';
      case 'Pending Shipment': return 'badge-orange';
      case 'Shipped':          return 'badge-blue';
      case 'Delivered':        return 'badge-green';
      default:                 return 'badge-gray';
    }
  }
}
