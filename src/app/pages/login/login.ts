import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  customerName = '';

  constructor(private router: Router) {}

  login() {

    localStorage.setItem('customerName', this.customerName);

    this.router.navigate(['/dashboard']);

  }

}