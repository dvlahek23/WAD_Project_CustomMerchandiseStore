import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService, Order } from '../../core/orders.service';
import { UserService } from '../../core/user';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manage-orders.html',
  styleUrls: ['./manage-orders.css'],
})
export class ManageOrders implements OnInit {
  pendingOrders: Order[] = [];
  allOrders: Order[] = [];
  loading = true;
  error = '';
  activeTab: 'pending' | 'all' = 'pending';

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

    this.ordersService.getPendingShipmentOrders().subscribe({
      next: (orders) => {
        this.pendingOrders = orders;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load pending orders';
        this.cdr.detectChanges();
      }
    });

    this.ordersService.getAllOrders().subscribe({
      next: (orders) => {
        this.allOrders = orders;
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

  shipOrder(order: Order) {
    this.ordersService.shipOrder(order.order_id).subscribe({
      next: () => {
        alert('Order marked as shipped!');
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to ship order');
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending_design': 'Pending Design',
      'design_approved': 'Awaiting Payment',
      'design_rejected': 'Design Rejected',
      'paid': 'Paid - Ready to Ship',
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

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setTab(tab: 'pending' | 'all') {
    this.activeTab = tab;
  }
}
