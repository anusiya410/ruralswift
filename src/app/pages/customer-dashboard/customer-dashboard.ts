import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, UserProfile } from '../../services/api.service';

declare const lucide: any;
declare const gsap: any;

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  estimatedDelivery: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass, CommonModule, FormsModule],
  templateUrl: './customer-dashboard.html',
  styleUrls: ['./customer-dashboard.css']
})
export class CustomerDashboardComponent implements OnInit, AfterViewInit {

  customerName = '';
  selectedSection = 'dashboard';
  orderSearchQuery = '';

  // Profile form model
  profileForm: UserProfile = {
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  };

  // UI state
  profileLoading = false;
  profileSaving = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;

  // ── Mock Orders Data ──────────────────────────────────────
  ordersList: Order[] = [
    {
      id: 'ORD12345',
      date: '10 Jun 2026',
      total: 620,
      status: 'Shipped',
      estimatedDelivery: '12 Jun 2026',
      items: [
        { name: 'Herbal Cough Syrup 100ml', qty: 1, image: 'https://placehold.co/64x64/dcfce7/1f2937?text=Syrup' },
        { name: 'Premium Rice 5kg',          qty: 1, image: 'https://placehold.co/64x64/fef9c3/1f2937?text=Rice' },
        { name: 'Water Bottle 1L',           qty: 2, image: 'https://placehold.co/64x64/dbeafe/1f2937?text=Bottle' }
      ]
    },
    {
      id: 'ORD09876',
      date: '25 May 2026',
      total: 1450,
      status: 'Delivered',
      estimatedDelivery: '28 May 2026',
      items: [
        { name: 'Neem Fertilizer 1kg',       qty: 2, image: 'https://placehold.co/64x64/d1fae5/1f2937?text=Fertilizer' },
        { name: 'LED Solar Lantern',          qty: 1, image: 'https://placehold.co/64x64/ede9fe/1f2937?text=Lantern' }
      ]
    },
    {
      id: 'ORD07431',
      date: '10 May 2026',
      total: 380,
      status: 'Delivered',
      estimatedDelivery: '13 May 2026',
      items: [
        { name: 'Ayurvedic Pain Balm',       qty: 3, image: 'https://placehold.co/64x64/fee2e2/1f2937?text=Balm' }
      ]
    },
    {
      id: 'ORD06112',
      date: '02 Apr 2026',
      total: 210,
      status: 'Cancelled',
      estimatedDelivery: '05 Apr 2026',
      items: [
        { name: 'Wheat Flour 2kg',           qty: 1, image: 'https://placehold.co/64x64/fef3c7/1f2937?text=Flour' }
      ]
    }
  ];

  get filteredOrders(): Order[] {
    const q = this.orderSearchQuery.toLowerCase().trim();
    if (!q) return this.ordersList;
    return this.ordersList.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.items.some(i => i.name.toLowerCase().includes(q))
    );
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Delivered':        return 'status-delivered';
      case 'Shipped':          return 'status-shipped';
      case 'Out for Delivery': return 'status-out';
      case 'Packed':
      case 'Confirmed':
      case 'Placed':           return 'status-processing';
      case 'Cancelled':        return 'status-cancelled';
      default:                 return 'status-processing';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Delivered':        return 'check-circle';
      case 'Shipped':          return 'truck';
      case 'Out for Delivery': return 'map-pin';
      case 'Cancelled':        return 'x-circle';
      default:                 return 'package';
    }
  }

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // ── Auth Guard ──
    if (!this.api.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    const stored = this.api.getStoredUser();
    if (stored) {
      this.customerName = stored.first_name || stored.email || 'Customer';
      this.profileForm  = { ...stored };
    } else {
      this.customerName = localStorage.getItem('customerName') || 'Customer';
    }

    // Deep-link via query param ?section=orders
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.setSection(params['section']);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      lucide.createIcons();
      gsap.from('#section-dashboard', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out'
      });
    }, 50);
  }

  setSection(section: string): void {
    this.selectedSection = section;

    if (section === 'profile') { this.loadProfile(); }

    const knownSections = ['dashboard', 'profile', 'orders', 'track', 'address', 'wishlist', 'feedback', 'settings'];
    setTimeout(() => {
      lucide.createIcons();
      const sectionId = knownSections.includes(section) ? `section-${section}` : 'section-blank';
      const el = document.getElementById(sectionId);
      if (el) {
        gsap.fromTo(el,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    }, 20);
  }

  /** Load profile from NeonDB via API */
  loadProfile(): void {
    // If no token at all, don't even try
    if (!this.api.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    this.profileLoading = true;

    this.api.getProfile().subscribe({
      next: (res) => {
        this.profileForm  = { ...res.user };
        this.customerName = res.user.first_name || res.user.email || 'Customer';
        this.profileLoading = false;
      },
      error: (err) => {
        this.profileLoading = false;

        // Token expired or invalid → redirect to login
        if (err.status === 401 || err.status === 403) {
          this.api.clearSession();
          this.router.navigate(['/login']);
          return;
        }

        // Backend unreachable → fall back to locally cached data
        const stored = this.api.getStoredUser();
        if (stored) {
          this.profileForm  = { ...stored };
          this.customerName = stored.first_name || stored.email || 'Customer';
          this.showToastMessage('Showing cached data — backend unreachable.', 'error');
        } else {
          this.showToastMessage('Could not load profile. Is the backend running?', 'error');
        }
      }
    });
  }

  /** Save profile changes to NeonDB */
  onSaveProfile(): void {
    this.profileSaving = true;
    this.api.updateProfile(this.profileForm).subscribe({
      next: (res) => {
        this.profileSaving = false;
        this.customerName  = res.user.first_name || res.user.email || 'Customer';
        this.api.saveSession(this.api.getToken()!, res.user);
        this.showToastMessage('Profile updated successfully! ✓', 'success');
      },
      error: (err) => {
        this.profileSaving = false;
        this.showToastMessage(err.error?.message || 'Failed to save profile.', 'error');
      }
    });
  }

  /** Logout */
  logout(): void {
    this.api.clearSession();
    this.router.navigate(['/login']);
  }

  private showToastMessage(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType    = type;
    this.showToast    = true;
    setTimeout(() => { this.showToast = false; }, 3500);
  }

}
