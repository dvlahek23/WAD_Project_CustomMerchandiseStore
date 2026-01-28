import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  custom_text?: string;
  text_color?: string;
  text_position_x?: number;
  text_position_y?: number;
  text_width?: number;
  text_height?: number;
  custom_image?: string;
  image_position_x?: number;
  image_position_y?: number;
  image_width?: number;
  image_height?: number;
  product_name?: string;
  picture_url?: string;
}

export interface Order extends OrderItem {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  designer_id?: number;
  designer_reviewed_at?: string;
  paid_at?: string;
  shipped_at?: string;
  rejection_reason?: string;
  customer_name?: string;
  designer_name?: string;
}

export interface CreateOrderRequest {
  productId: number;
  quantity: number;
  customText?: string;
  textColor?: string;
  textPositionX?: number;
  textPositionY?: number;
  textWidth?: number;
  textHeight?: number;
  customImage?: string;
  imagePositionX?: number;
  imagePositionY?: number;
  imageWidth?: number;
  imageHeight?: number;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private http: HttpClient) {}

  createOrder(order: CreateOrderRequest): Observable<{ message: string; orderId: number }> {
    return this.http.post<{ message: string; orderId: number }>('/api/orders', order);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/my-orders');
  }

  getPendingDesignOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/pending-design');
  }

  approveDesign(orderId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/orders/${orderId}/approve-design`, {});
  }

  rejectDesign(orderId: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/orders/${orderId}/reject-design`, { reason });
  }

  payOrder(orderId: number, paymentMethod: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/orders/${orderId}/pay`, { paymentMethod });
  }

  getPendingShipmentOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/pending-shipment');
  }

  shipOrder(orderId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/orders/${orderId}/ship`, {});
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/all');
  }
}
