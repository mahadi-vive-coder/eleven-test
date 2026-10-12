import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { SearchModal } from './components/search/SearchModal';
import { CartDrawer } from './components/cart/CartDrawer';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { ClubsPage } from './pages/ClubsPage';
import { PlayersPage } from './pages/PlayersPage';
import { ExchangePolicyPage } from './pages/ExchangePolicyPage';
import { SizeGuidePage } from './pages/SizeGuidePage';
import { setPageSeo } from './lib/seo';

interface NavigationState {
  route: string;
  productSlug?: string | null;
  trackingOrderId?: string;
  shopFilterClub?: string;
  shopFilterEdition?: string;
}

function parseLocationToState(): NavigationState {
  if (typeof window === 'undefined') return { route: 'home' };

  // Backward-compatibility redirect: convert legacy hash routing (e.g. #/product/...) to pathname
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const rawTarget = window.location.hash.replace(/^#\/?/, '/');
    const cleanTarget = rawTarget.startsWith('/') ? rawTarget : `/${rawTarget}`;
    window.history.replaceState(null, '', cleanTarget);
  }

  const pathname = window.location.pathname;
  const search = window.location.search;

  if (!pathname || pathname === '/' || pathname === '/home') {
    return { route: 'home' };
  }

  if (pathname.startsWith('/product/')) {
    const slug = pathname.replace(/^\/product\//, '').split('/')[0];
    return { route: 'product-detail', productSlug: slug };
  }

  if (pathname === '/shop' || pathname.startsWith('/shop/')) {
    const params = new URLSearchParams(search);
    return {
      route: 'shop',
      shopFilterClub: params.get('club') || undefined,
      shopFilterEdition: params.get('edition') || undefined,
    };
  }

  if (pathname === '/retro') {
    return { route: 'shop', shopFilterEdition: 'Retro' };
  }

  if (pathname === '/worldcup') {
    return { route: 'shop', shopFilterEdition: 'World Cup' };
  }

  if (pathname === '/track-order' || pathname.startsWith('/track-order/')) {
    const params = new URLSearchParams(search);
    return {
      route: 'track-order',
      trackingOrderId: params.get('id') || undefined,
    };
  }

  const cleanRoute = pathname.replace(/^\/+/, '').split('/')[0];
  return { route: cleanRoute || 'home' };
}

function stateToPath(state: NavigationState): string {
  if (state.route === 'home') return '/';
  if (state.route === 'product-detail' && state.productSlug) {
    return `/product/${state.productSlug}`;
  }
  if (state.route === 'shop') {
    const params = new URLSearchParams();
    if (state.shopFilterClub) params.set('club', state.shopFilterClub);
    if (state.shopFilterEdition) params.set('edition', state.shopFilterEdition);
    const queryString = params.toString();
    return queryString ? `/shop?${queryString}` : '/shop';
  }
  if (state.route === 'track-order') {
    return state.trackingOrderId ? `/track-order?id=${encodeURIComponent(state.trackingOrderId)}` : '/track-order';
  }
  return `/${state.route}`;
}

export function AppContent() {
  const initialNavState = parseLocationToState();
  const [currentRoute, setCurrentRoute] = useState<string>(initialNavState.route);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(initialNavState.productSlug || null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>(initialNavState.trackingOrderId);
  const [shopFilterClub, setShopFilterClub] = useState<string | undefined>(initialNavState.shopFilterClub);
  const [shopFilterEdition, setShopFilterEdition] = useState<string | undefined>(initialNavState.shopFilterEdition);

  // Sync initial state with browser history (History API)
  useEffect(() => {
    const currentState = {
      route: currentRoute,
      productSlug: selectedProductSlug,
      trackingOrderId,
      shopFilterClub,
      shopFilterEdition,
    };
    window.history.replaceState(currentState, '', stateToPath(currentState));

    const handlePopState = (event: PopStateEvent) => {
      const state: NavigationState = event.state || parseLocationToState();
      setCurrentRoute(state.route || 'home');
      setSelectedProductSlug(state.productSlug || null);
      setTrackingOrderId(state.trackingOrderId);
      setShopFilterClub(state.shopFilterClub);
      setShopFilterEdition(state.shopFilterEdition);
      setSearchModalOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll to top whenever route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute, selectedProductSlug]);

  // Per-route SEO meta tags & canonical URL
  useEffect(() => {
    if (currentRoute === 'home') {
      setPageSeo({
        title: 'Eleven Nation | Premium Football Jerseys & Kits Bangladesh',
        description: "Wear the game. Bangladesh's premier football jersey destination. Authentic quality Player Editions, Fan Editions, Retro Classics, and Custom Names & Numbers.",
        canonicalPath: '/',
      });
    } else if (currentRoute === 'shop') {
      const editionLabel = shopFilterEdition ? `${shopFilterEdition} ` : '';
      const clubLabel = shopFilterClub ? `${shopFilterClub} ` : '';
      setPageSeo({
        title: `${clubLabel}${editionLabel}Jerseys & Kits | Eleven Nation Bangladesh`,
        description: 'Shop official 2026/27 Player Editions, Fan Kits, and Retro Classics. Custom heat-press printing available with Cash on Delivery nationwide in Bangladesh.',
        canonicalPath: '/shop',
      });
    } else if (currentRoute === 'clubs') {
      setPageSeo({
        title: 'Shop by Club & Teams | Eleven Nation Bangladesh',
        description: 'Browse official 2026/27 jerseys by football club: Real Madrid, Arsenal, Barcelona, Man City, and more. Matchday authentic specifications.',
        canonicalPath: '/clubs',
      });
    } else if (currentRoute === 'players') {
      setPageSeo({
        title: 'Star Players Roster | Eleven Nation Bangladesh',
        description: 'Choose your superstar or customize your kit with official matchday name & number heat-press printing in Bangladesh.',
        canonicalPath: '/players',
      });
    } else if (currentRoute === 'track-order') {
      setPageSeo({
        title: 'Track Your Order | Eleven Nation Bangladesh',
        description: 'Live tracking for your Eleven Nation jersey order with order number and phone verification. Fast delivery across all 64 districts.',
        canonicalPath: '/track-order',
      });
    } else if (currentRoute === 'wishlist') {
      setPageSeo({
        title: 'Saved Jerseys | Eleven Nation Bangladesh',
        description: 'Your personal Eleven Nation jersey wishlist. Save favorite matchday kits and custom editions.',
        canonicalPath: '/wishlist',
      });
    } else if (currentRoute === 'checkout') {
      setPageSeo({
        title: 'Checkout & Delivery | Eleven Nation Bangladesh',
        description: 'Complete your football jersey purchase with Cash on Delivery across all 64 districts in Bangladesh.',
        canonicalPath: '/checkout',
      });
    } else if (currentRoute === 'account') {
      setPageSeo({
        title: 'Customer Account | Eleven Nation Bangladesh',
        description: 'Manage your Eleven Nation orders, profile details, and delivery addresses.',
        canonicalPath: '/account',
      });
    } else if (currentRoute === 'size-guide') {
      setPageSeo({
        title: 'Jersey Size & Fit Guide | Eleven Nation Bangladesh',
        description: 'Find your perfect fit. Compare Player Edition athletic slim cut vs Fan Edition regular fit measurements in inches.',
        canonicalPath: '/size-guide',
      });
    } else if (currentRoute === 'exchange-policy') {
      setPageSeo({
        title: 'Exchange & Return Policy | Eleven Nation Bangladesh',
        description: 'Hassle-free 7-day size exchange and authentic return guarantee for football kits across Bangladesh.',
        canonicalPath: '/exchange-policy',
      });
    }
  }, [currentRoute, shopFilterClub, shopFilterEdition]);

  const navigateTo = (newState: NavigationState, replace = false) => {
    setCurrentRoute(newState.route);
    setSelectedProductSlug(newState.productSlug || null);
    setTrackingOrderId(newState.trackingOrderId);
    setShopFilterClub(newState.shopFilterClub);
    setShopFilterEdition(newState.shopFilterEdition);

    const path = stateToPath(newState);
    if (replace) {
      window.history.replaceState(newState, '', path);
    } else {
      window.history.pushState(newState, '', path);
    }
  };

  const handleNavigate = (route: string) => {
    const clean = route.startsWith('/') ? route.slice(1) : route;

    if (clean.startsWith('product/')) {
      const slug = clean.replace(/^product\//, '');
      navigateTo({
        route: 'product-detail',
        productSlug: slug,
      });
      return;
    }

    if (clean.startsWith('shop?') || clean.startsWith('shop/')) {
      const queryPart = clean.includes('?') ? clean.split('?')[1] : '';
      const params = new URLSearchParams(queryPart);
      const clubParam = params.get('club');
      const editionParam = params.get('edition');

      navigateTo({
        route: 'shop',
        shopFilterClub: clubParam || undefined,
        shopFilterEdition: editionParam || undefined,
      });
      return;
    }

    if (clean === 'retro') {
      navigateTo({
        route: 'shop',
        shopFilterEdition: 'Retro',
      });
      return;
    }

    if (clean === 'worldcup') {
      navigateTo({
        route: 'shop',
        shopFilterEdition: 'World Cup',
      });
      return;
    }

    if (clean === 'home' || clean === '') {
      navigateTo({ route: 'home' });
      return;
    }

    navigateTo({ route: clean });
  };

  const handleSelectProduct = (slug: string) => {
    navigateTo({
      route: 'product-detail',
      productSlug: slug,
    });
  };

  const handleSelectClub = (clubSlug: string) => {
    navigateTo({
      route: 'shop',
      shopFilterClub: clubSlug,
    });
  };

  const handleOrderSuccess = (orderId: string) => {
    navigateTo({
      route: 'track-order',
      trackingOrderId: orderId,
    });
  };

  const handleTrackOrderFromAccount = (orderId: string) => {
    navigateTo({
      route: 'track-order',
      trackingOrderId: orderId,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-[#111111] font-sans antialiased selection:bg-[#F1600D] selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Top Banner with announcements */}
      <AnnouncementBar />

      {/* Primary Sticky Header */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Dynamic View Page */}
      <main className="flex-1 pb-20 lg:pb-0 w-full min-w-0 max-w-full overflow-x-hidden">
        {currentRoute === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'shop' && (
          <ShopPage
            initialClub={shopFilterClub}
            initialEdition={shopFilterEdition}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'product-detail' && selectedProductSlug && (
          <ProductDetailPage
            slug={selectedProductSlug}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'checkout' && (
          <CheckoutPage
            onNavigate={handleNavigate}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentRoute === 'track-order' && (
          <OrderTrackingPage
            initialOrderId={trackingOrderId}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'wishlist' && (
          <WishlistPage
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'account' && (
          <AccountPage
            onNavigate={handleNavigate}
            onTrackOrder={handleTrackOrderFromAccount}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'clubs' && (
          <ClubsPage onNavigate={handleNavigate} />
        )}

        {currentRoute === 'players' && (
          <PlayersPage
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentRoute === 'exchange-policy' && (
          <ExchangePolicyPage onNavigate={handleNavigate} />
        )}

        {currentRoute === 'size-guide' && (
          <SizeGuidePage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Mobile Bottom Bar Navigation */}
      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Global Interactive Overlays */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectProduct={handleSelectProduct}
        onSelectClub={handleSelectClub}
        onNavigate={handleNavigate}
      />

      <CartDrawer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
