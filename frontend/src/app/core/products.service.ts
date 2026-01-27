import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  product_id: number;
  name: string;
  description: string;
  base_price: number;
  product_type: string;
  category_id: number;
  picture_url: string;
  category_name: string;
}

export interface Category {
  category_id: number;
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {

  constructor(private http: HttpClient) {}

  getProducts(filters?: { category?: string; type?: string; search?: string }): Observable<Product[]> {
    let params: any = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.type) params.type = filters.type;
    if (filters?.search) params.search = filters.search;
    return this.http.get<Product[]>('/api/products', { params });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/products/categories');
  }

  getProductTypes(): Observable<string[]> {
    return this.http.get<string[]>('/api/products/types');
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }
}
