import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy {

  /** Mobile hamburger menu state */
  menuOpen = false;

  /** Cart count — reads from localStorage, will be replaced by CartService */
  cartCount = 0;

  /** Search query */
  searchQuery = '';

  private routerSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateCartCount();

    // Close menu on every navigation
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMenu();
      this.updateCartCount();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  // ── Auth helpers ─────────────────────────────────────────────────────────

  get isLoggedIn(): boolean {
    try {
      return !!localStorage.getItem('token');
    } catch {
      return false;
    }
  }

  get userName(): string {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return 'Sign In';
      const user = JSON.parse(raw);
      return user.first_name || user.name || user.email?.split('@')[0] || 'Account';
    } catch {
      return 'Sign In';
    }
  }

  get userInitial(): string {
    return (this.userName !== 'Sign In' ? this.userName.charAt(0) : '').toUpperCase();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('customerName');
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  // ── Cart ─────────────────────────────────────────────────────────────────

  updateCartCount(): void {
    try {
      const cart = localStorage.getItem('cart');
      if (!cart) { this.cartCount = 0; return; }
      const items = JSON.parse(cart);
      this.cartCount = Array.isArray(items)
        ? items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
        : 0;
    } catch {
      this.cartCount = 0;
    }
  }

  // ── Mobile menu ──────────────────────────────────────────────────────────

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
  }

  closeMenu(): void {
    this.menuOpen = false;
    document.body.style.overflow = '';
  }

  // Close on Escape key
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  // ── Search ───────────────────────────────────────────────────────────────

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { q: this.searchQuery.trim() }
      });
      this.closeMenu();
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onSearch();
  }
}
