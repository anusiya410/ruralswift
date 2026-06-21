import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customer-dashboard.html',
  styleUrls: ['./customer-dashboard.css']
})
export class CustomerDashboardComponent implements OnInit {

  customerName = '';

  isSidebarOpen = false;

  /* ACTIVE MENU */
  selectedMenu = 'dashboard';

  ngOnInit(): void {

    this.customerName =
      localStorage.getItem('customerName') || 'Customer';

  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

}