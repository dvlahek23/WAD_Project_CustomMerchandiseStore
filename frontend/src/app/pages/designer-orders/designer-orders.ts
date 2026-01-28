import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrdersService, Order } from '../../core/orders.service';
import { UserService } from '../../core/user';

@Component({
  selector: 'app-designer-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './designer-orders.html',
  styleUrls: ['./designer-orders.css'],
})
export class DesignerOrders implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = '';

  // Rejection modal
  showRejectModal = false;
  selectedOrder: Order | null = null;
  rejectionReason = '';

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
    this.ordersService.getPendingDesignOrders().subscribe({
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

  approveOrder(order: Order) {
    this.ordersService.approveDesign(order.order_id).subscribe({
      next: () => {
        alert('Design approved!');
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to approve design');
      }
    });
  }

  openRejectModal(order: Order) {
    this.selectedOrder = order;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedOrder = null;
    this.rejectionReason = '';
  }

  confirmReject() {
    if (!this.selectedOrder) return;

    this.ordersService.rejectDesign(this.selectedOrder.order_id, this.rejectionReason).subscribe({
      next: () => {
        alert('Design rejected.');
        this.closeRejectModal();
        this.loadOrders();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to reject design');
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
