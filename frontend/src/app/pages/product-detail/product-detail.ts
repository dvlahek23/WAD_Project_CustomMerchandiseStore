import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService, Product } from '../../core/products.service';
import { UserService } from '../../core/user';
import { OrdersService } from '../../core/orders.service';
import { ReviewsService, Review } from '../../core/reviews.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  loading = true;
  error = '';

  customText = '';
  quantity = 1;
  selectedColor = '#ffffff';

  textBoxX = 50;
  textBoxY = 50;
  textBoxWidth = 40;
  textBoxHeight = 20;

  uploadedImage: string | null = null;
  imageBoxX = 50;
  imageBoxY = 50;
  imageBoxWidth = 30;
  imageBoxHeight = 30;

  isDragging = false;
  isResizing = false;
  isDraggingImage = false;
  isResizingImage = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private containerRect: DOMRect | null = null;

  colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Navy', value: '#1a365d' },
    { name: 'Red', value: '#c53030' },
    { name: 'Green', value: '#276749' },
    { name: 'Gray', value: '#4a5568' },
  ];

  categoryColors: Record<string, string> = {
    'Clothing': '#5A3A31',
    'Accessories': '#84714F',
    'Drinkware': '#C4A35A',
    'Stationery': '#4A7C59',
  };

  reviews: Review[] = [];
  loadingReviews = false;
  newReviewRating = 5;
  newReviewComment = '';
  submittingReview = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    public userService: UserService,
    private ordersService: OrdersService,
    private reviewsService: ReviewsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(parseInt(productId));
    } else {
      this.error = 'Product not found';
      this.loading = false;
    }
  }

  loadProduct(id: number) {
    this.productsService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.loadReviews(id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Product not found';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReviews(productId: number) {
    this.loadingReviews = true;
    this.reviewsService.getReviews(productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loadingReviews = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingReviews = false;
        this.cdr.detectChanges();
      }
    });
  }

  get canAddReview(): boolean {
    return this.userService.isLoggedIn &&
           this.userService.user?.role?.toLowerCase() !== 'control';
  }

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / this.reviews.length;
  }

  get starDistribution(): { star: number; count: number; percentage: number; color: string }[] {
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    const counts = [0, 0, 0, 0, 0];

    this.reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });

    const total = this.reviews.length || 1;
    return counts.map((count, i) => ({
      star: i + 1,
      count,
      percentage: (count / total) * 100,
      color: colors[i]
    }));
  }

  get pieChartSegments(): { path: string; color: string; star: number; percentage: number }[] {
    const segments: { path: string; color: string; star: number; percentage: number }[] = [];
    const distribution = this.starDistribution.filter(d => d.count > 0);

    if (distribution.length === 0) return segments;

    let currentAngle = -90;
    const cx = 50, cy = 50, r = 40;

    distribution.forEach(d => {
      const angle = (d.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      segments.push({
        path,
        color: d.color,
        star: d.star,
        percentage: d.percentage
      });

      currentAngle = endAngle;
    });

    return segments;
  }

  submitReview() {
    if (!this.product || !this.canAddReview) return;

    this.submittingReview = true;
    this.reviewsService.createReview({
      product_id: this.product.product_id,
      rating: this.newReviewRating,
      comment: this.newReviewComment || undefined
    }).subscribe({
      next: () => {
        this.newReviewComment = '';
        this.newReviewRating = 5;
        this.loadReviews(this.product!.product_id);
        this.submittingReview = false;
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to submit review');
        this.submittingReview = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  canDeleteReview(review: Review): boolean {
    return this.userService.isLoggedIn && (
      review.customer_id === this.userService.user?.user_id ||
      this.userService.isAdmin
    );
  }

  deleteReview(review: Review) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewsService.deleteReview(review.review_id).subscribe({
      next: () => {
        this.loadReviews(this.product!.product_id);
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to delete review');
      }
    });
  }

  get totalPrice(): number {
    if (!this.product) return 0;
    return this.product.base_price * this.quantity;
  }

  getCategoryColor(): string {
    if (!this.product) return '#5A3A31';
    return this.categoryColors[this.product.category_name] || '#5A3A31';
  }

  incrementQuantity() {
    if (this.quantity < 99) {
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (!this.userService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.orderNow();
  }

  orderNow() {
    if (!this.userService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.product) return;

    const orderData = {
      productId: this.product.product_id,
      quantity: this.quantity,
      customText: this.customText || undefined,
      textColor: this.selectedColor,
      textPositionX: this.textBoxX,
      textPositionY: this.textBoxY,
      textWidth: this.textBoxWidth,
      textHeight: this.textBoxHeight,
      customImage: this.uploadedImage || undefined,
      imagePositionX: this.uploadedImage ? this.imageBoxX : undefined,
      imagePositionY: this.uploadedImage ? this.imageBoxY : undefined,
      imageWidth: this.uploadedImage ? this.imageBoxWidth : undefined,
      imageHeight: this.uploadedImage ? this.imageBoxHeight : undefined,
    };

    this.ordersService.createOrder(orderData).subscribe({
      next: () => {
        alert(`Order placed for ${this.quantity}x ${this.product?.name}!\nYour order is now pending designer review.`);
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to place order');
      }
    });
  }

  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    this.isResizing = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onResizeStart(event: MouseEvent) {
    this.isResizing = true;
    this.isDragging = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.containerRect) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    const percentX = (deltaX / this.containerRect.width) * 100;
    const percentY = (deltaY / this.containerRect.height) * 100;

    if (this.isDragging) {
      this.textBoxX = Math.max(10, Math.min(90, this.textBoxX + percentX));
      this.textBoxY = Math.max(10, Math.min(90, this.textBoxY + percentY));
    }

    if (this.isResizing) {
      this.textBoxWidth = Math.max(15, Math.min(80, this.textBoxWidth + percentX));
      this.textBoxHeight = Math.max(10, Math.min(60, this.textBoxHeight + percentY));
    }

    if (this.isDraggingImage) {
      this.imageBoxX = Math.max(10, Math.min(90, this.imageBoxX + percentX));
      this.imageBoxY = Math.max(10, Math.min(90, this.imageBoxY + percentY));
    }

    if (this.isResizingImage) {
      this.imageBoxWidth = Math.max(10, Math.min(80, this.imageBoxWidth + percentX));
      this.imageBoxHeight = Math.max(10, Math.min(80, this.imageBoxHeight + percentY));
    }

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.cdr.detectChanges();
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.isDraggingImage = false;
    this.isResizingImage = false;
    this.containerRect = null;
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeUploadedImage() {
    this.uploadedImage = null;
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
  }

  onImageDragStart(event: MouseEvent) {
    this.isDraggingImage = true;
    this.isResizingImage = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onImageResizeStart(event: MouseEvent) {
    this.isResizingImage = true;
    this.isDraggingImage = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }
}
