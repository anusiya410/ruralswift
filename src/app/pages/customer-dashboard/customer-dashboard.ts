import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, UserProfile } from '../../services/api.service';

declare const lucide: any;
declare const gsap: any;

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

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    // ── Auth Guard: redirect to login if no token ──
    if (!this.api.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    // Load from localStorage immediately (instant render)
    const stored = this.api.getStoredUser();
    if (stored) {
      this.customerName = stored.first_name || stored.email || 'Customer';
      this.profileForm  = { ...stored };
    } else {
      this.customerName = localStorage.getItem('customerName') || 'Customer';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      lucide.createIcons();
      gsap.from('#section-dashboard', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out'
      });
    }, 50);
  }

  setSection(section: string): void {
    this.selectedSection = section;

    // Fetch fresh profile from API when opening profile section
    if (section === 'profile') {
      this.loadProfile();
    }

    setTimeout(() => {
      lucide.createIcons();
      const sectionId = ['dashboard', 'profile', 'orders'].includes(section)
        ? `section-${section}`
        : 'section-blank';
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
