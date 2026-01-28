import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ProfileComponent } from './pages/profile/profile';
import { Products } from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Documentation } from './pages/documentation/documentation';
import { MyOrders } from './pages/my-orders/my-orders';
import { DesignerOrders } from './pages/designer-orders/designer-orders';
import { ManageOrders } from './pages/manage-orders/manage-orders';
import { ManageProducts } from './pages/manage-products/manage-products';
import { guestGuard, authGuard, designerGuard, managementGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  { path: '', component: Home },
  { path: 'products', component: Products },
  { path: 'products/:id', component: ProductDetail },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'my-orders', component: MyOrders, canActivate: [authGuard] },
  { path: 'designer-orders', component: DesignerOrders, canActivate: [designerGuard] },
  { path: 'manage-orders', component: ManageOrders, canActivate: [managementGuard] },
  { path: 'manage-products', component: ManageProducts, canActivate: [managementGuard] },
  { path: 'documentation', component: Documentation },
];
