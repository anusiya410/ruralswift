import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverDashboardComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  @ViewChild('map') mapContainer!: ElementRef;
  private map!: L.Map;
  
  public runs = signal<any[]>([]);
  public isLoading = signal(true);
  public activeRun = signal<any | null>(null);

  // Auth & State
  public isAuthenticated = signal(false);
  public isDriver = signal(false);
  public isUpgrading = signal(false);

  ngOnInit() {
    this.checkAuth();
  }

  checkAuth() {
    this.isAuthenticated.set(this.api.isLoggedIn());
    const user = this.api.getStoredUser();
    this.isDriver.set(user?.role === 'delivery');

    if (this.isAuthenticated() && this.isDriver()) {
      this.loadRuns();
    } else {
      this.isLoading.set(false);
    }
  }

  becomeDriver() {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.isUpgrading.set(true);
    this.api.becomeDriver().subscribe({
      next: (res) => {
        this.isDriver.set(true);
        const updatedUser = res.data?.user || (res as any).user;
        localStorage.setItem('rs_user', JSON.stringify(updatedUser));
        this.toast.success('Welcome to RuralSwift Logistics!');
        this.isUpgrading.set(false);
        this.loadRuns();
      },
      error: () => {
        this.toast.error('Failed to register as delivery partner.');
        this.isUpgrading.set(false);
      }
    });
  }

  ngAfterViewInit() {
    // We'll initialize the map when an active run is selected
  }

  loadRuns() {
    this.isLoading.set(true);
    this.api.getDriverRuns().subscribe({
      next: (res) => {
        this.runs.set(res.data?.runs || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load delivery runs.');
        this.isLoading.set(false);
      }
    });
  }

  viewRun(run: any) {
    this.activeRun.set(run);

    // Wait a tick for the DOM to render the map container, then geocode & render
    setTimeout(() => {
      this.initMap(run);
    }, 100);
  }

  backToList() {
    this.activeRun.set(null);
    if (this.map) {
      this.map.remove();
    }
  }

  async geocodeIndianAddress(address: string): Promise<[number, number] | null> {
    const headers = { 'Accept-Language': 'en' };

    const tryFetch = async (query: string): Promise<[number, number] | null> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`,
          { headers }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch { /* ignore */ }
      return null;
    };

    // 1. Try PIN code first (most reliable for India)
    const pinMatch = address.match(/\b(\d{6})\b/);
    if (pinMatch) {
      const result = await tryFetch(`${pinMatch[1]}, India`);
      if (result) return result;
    }

    // 2. Try last 3 parts (city, state, pin)
    const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length >= 3) {
      const result = await tryFetch(parts.slice(-3).join(', ') + ', India');
      if (result) return result;
    }

    // 3. Try last 2 parts (city, state)
    if (parts.length >= 2) {
      const result = await tryFetch(parts.slice(-2).join(', ') + ', India');
      if (result) return result;
    }

    // 4. Full address fallback
    return tryFetch(address + ', India');
  }

  async initMap(run: any) {
    if (this.map) {
      this.map.remove();
    }

    // Default to India center until geocoding resolves
    this.map = L.map(this.mapContainer.nativeElement).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const stops = run.stops || [];
    if (stops.length === 0) return;

    const latlngs: L.LatLngTuple[] = [];

    // Geocode each stop's real address
    for (let index = 0; index < stops.length; index++) {
      const stop = stops[index];
      const address = stop.address || stop.delivery_address || '';
      let lat: number;
      let lng: number;

      const coords = address ? await this.geocodeIndianAddress(address) : null;

      if (coords) {
        [lat, lng] = coords;
      } else {
        // Last resort: India center with slight offset
        lat = 20.5937 + (index * 0.01);
        lng = 78.9629 + (index * 0.01);
      }

      latlngs.push([lat, lng]);

      L.marker([lat, lng])
        .addTo(this.map)
        .bindPopup(`<b>Stop ${index + 1}</b><br>${address || 'Delivery Location'}`)
        .openPopup();
    }

    // Draw route line
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: '#4338ca', weight: 4, lineJoin: 'round' }).addTo(this.map);
    }

    // Fit map to all markers
    if (latlngs.length > 0) {
      this.map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
    }
  }

  markDelivered(orderId: number) {
    const otp = prompt('Please ask the customer for their Delivery OTP:');
    if (!otp) return;

    this.api.updateDriverOrderStatus(orderId, 'delivered', otp).subscribe({
      next: () => {
        this.toast.success('Order delivered successfully!');
        this.loadRuns(); // Reload data
        this.activeRun.set(null); // Go back to list
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to verify OTP.');
      }
    });
  }
}
