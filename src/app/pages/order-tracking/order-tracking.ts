import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar';

interface TimelineStep {
  status: string;
  date: string;
  time: string;
  completed: boolean;
}

interface OrderDetails {
  orderId: string;
  date: string;
  status: string;
  deliveryType: string;
  deliveryPartner: string;
  paymentMethod: string;
  contact: string;
  timeline: TimelineStep[];
}

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css'
})
export class OrderTrackingComponent {
  searchId = 'ORD12345';

  orderDetails: OrderDetails = {
    orderId: 'ORD12345',
    date: '10 May 2025',
    status: 'Shipped',
    deliveryType: 'Urgent Delivery',
    deliveryPartner: 'Ramesh Kumar',
    paymentMethod: 'Cash on Delivery (COD)',
    contact: '9876543210',
    timeline: [
      { status: 'Order Placed', date: '10 May 2025', time: '10:30 AM', completed: true },
      { status: 'Confirmed', date: '10 May 2025', time: '11:00 AM', completed: true },
      { status: 'Packed', date: '10 May 2025', time: '02:30 PM', completed: true },
      { status: 'Shipped', date: '11 May 2025', time: '09:00 AM', completed: true },
      { status: 'Out for Delivery', date: '11 May 2025', time: '02:00 PM', completed: false },
      { status: 'Delivered', date: '--', time: '--', completed: false }
    ]
  };

  readonly statuses = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  get currentStepIndex(): number {
    return this.statuses.indexOf(this.orderDetails.status);
  }

  get progressPercent(): number {
    return (this.currentStepIndex / (this.statuses.length - 1)) * 100;
  }

  get reversedTimeline(): (TimelineStep & { realIndex: number })[] {
    return [...this.orderDetails.timeline]
      .map((step, i) => ({ ...step, realIndex: i }))
      .reverse();
  }

  isCompleted(index: number): boolean {
    return index <= this.currentStepIndex;
  }

  isCurrent(index: number): boolean {
    return index === this.currentStepIndex;
  }

  getStepIcon(status: string): string {
    const icons: Record<string, string> = {
      'Order Placed': 'box',
      'Confirmed': 'check',
      'Packed': 'package',
      'Shipped': 'truck',
      'Out for Delivery': 'map-pin',
      'Delivered': 'check-circle'
    };
    return icons[status] || 'box';
  }
}
