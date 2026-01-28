import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Review {
  review_id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name: string;
}

export interface CreateReviewRequest {
  product_id: number;
  rating: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private http: HttpClient) {}

  getReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`/api/reviews?productId=${productId}`);
  }

  createReview(review: CreateReviewRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/reviews', review);
  }

  updateReview(reviewId: number, rating: number, comment?: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`/api/reviews/${reviewId}`, { rating, comment });
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`/api/reviews/${reviewId}`);
  }
}
