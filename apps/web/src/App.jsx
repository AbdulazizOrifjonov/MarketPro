import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StorefrontLayout } from '@/components/layout/StorefrontLayout';
import AuthLayout from '@/pages/auth/AuthLayout';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import Compare from '@/pages/Compare';
import Checkout from '@/pages/Checkout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import PhoneVerify from '@/pages/auth/PhoneVerify';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AccountLayout from '@/pages/account/AccountLayout';
import Profile from '@/pages/account/Profile';
import Orders from '@/pages/account/Orders';
import OrderDetail from '@/pages/account/OrderDetail';
import Addresses from '@/pages/account/Addresses';
import AccountSettings from '@/pages/account/Settings';
import Notifications from '@/pages/account/Notifications';
import RecentlyViewed from '@/pages/account/RecentlyViewed';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminProducts from '@/pages/admin/Products';
import AdminProductNew from '@/pages/admin/ProductNew';
import AdminProductEdit from '@/pages/admin/ProductEdit';
import AdminCategories from '@/pages/admin/Categories';
import AdminCategoryNew from '@/pages/admin/CategoryNew';
import AdminCategoryEdit from '@/pages/admin/CategoryEdit';
import AdminOrders from '@/pages/admin/Orders';
import AdminOrderDetail from '@/pages/admin/OrderDetail';
import AdminUsers from '@/pages/admin/Users';
import AdminSliders from '@/pages/admin/Sliders';
import AdminSliderNew from '@/pages/admin/SliderNew';
import AdminSliderEdit from '@/pages/admin/SliderEdit';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminCouponNew from '@/pages/admin/CouponNew';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminFlashSale from '@/pages/admin/FlashSale';
import AdminManageUsers from '@/pages/admin/AdminUsers';
import AdminBrands from '@/pages/admin/Brands';
import AdminReviews from '@/pages/admin/Reviews';
import { useAuthStore } from '@/store/authStore';

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/compare" element={<Compare />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="recently-viewed" element={<RecentlyViewed />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductNew />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductEdit />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/categories/new" element={<AdminCategoryNew />} />
            <Route path="/admin/categories/:id/edit" element={<AdminCategoryEdit />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/sliders" element={<AdminSliders />} />
            <Route path="/admin/sliders/new" element={<AdminSliderNew />} />
            <Route path="/admin/sliders/:id/edit" element={<AdminSliderEdit />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/coupons/new" element={<AdminCouponNew />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/flash-sale" element={<AdminFlashSale />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/admin-users" element={<AdminManageUsers />} />
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/phone-verify" element={<PhoneVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
