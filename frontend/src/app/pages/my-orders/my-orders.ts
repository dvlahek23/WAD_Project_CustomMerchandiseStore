import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService, Order } from '../../core/orders.service';
import { UserService } from '../../core/user';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css'],
})
export class MyOrders implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = '';

  constructor(
    private ordersService: OrdersService,
    public userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.ordersService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load orders';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending_design': 'Pending Design Review',
      'design_approved': 'Ready for Payment',
      'design_rejected': 'Design Rejected',
      'paid': 'Paid - Awaiting Shipment',
      'shipped': 'Shipped',
      'completed': 'Completed'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending_design': 'status-pending',
      'design_approved': 'status-approved',
      'design_rejected': 'status-rejected',
      'paid': 'status-paid',
      'shipped': 'status-shipped',
      'completed': 'status-completed'
    };
    return classes[status] || '';
  }

  canPay(order: Order): boolean {
    return order.status === 'design_approved';
  }

  payOrder(order: Order) {
    if (!this.canPay(order)) return;

    this.ordersService.payOrder(order.order_id, 'card').subscribe({
      next: () => {
        alert('Payment successful! Your order is now being processed.');
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.error || 'Payment failed');
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
