import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Toaster from './components/Toaster'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Search from './pages/Search'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import Account from './pages/Account'
import NotFound from './pages/NotFound'
import Unavailable from './pages/Unavailable'
import SellerLayout from './pages/seller/SellerLayout'
import SellerOverview from './pages/seller/SellerOverview'
import SellerProducts from './pages/seller/SellerProducts'
import SellerProductEditor from './pages/seller/SellerProductEditor'
import SellerOrders from './pages/seller/SellerOrders'
import SellerAnalytics from './pages/seller/SellerAnalytics'

function SiteLayout() {
  return (
    <>
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="order/:id/success"
              element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="about" element={<About />} />
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route path="503" element={<Unavailable />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="seller"
            element={
              <ProtectedRoute role="SELLER">
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerOverview />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/new" element={<SellerProductEditor />} />
            <Route path="products/:id/edit" element={<SellerProductEditor />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="analytics" element={<SellerAnalytics />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  )
}