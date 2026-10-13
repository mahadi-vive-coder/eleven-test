import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isVercel = Boolean(process.env.VERCEL);
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

const app = express();

app.use(express.json());

// Normalize Vercel rewritten paths if routed via /api
app.use((req, res, next) => {
  const vercelMatchedPath = req.headers['x-matched-path'];
  if (typeof vercelMatchedPath === 'string' && vercelMatchedPath) {
    if (req.url === '/api' || req.url === '/api/' || req.path === '/api') {
      req.url = vercelMatchedPath;
    }
  }
  next();
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

let supabaseAdmin: any = null;
if (isSupabaseConfigured) {
  try {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

// ============================================================================
// IN-MEMORY CATALOG & ORDER STORE (Resilient Fallback for AI Studio)
// ============================================================================
export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  club: string;
  category_id: string;
  edition: string;
  season: string;
  selling_price: number;
  compare_at_price: number;
  cost_price: number;
  is_featured: boolean;
  is_trending: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  sizes: Array<{ size: string; stock: number }>;
  stock: number;
  images: string[];
  available_players: Array<{ id: string; name: string; number: number | string }>;
  customization_fee: number;
  fabric_details: string;
  fit_type: string;
  status: string;
  rating: number;
  review_count: number;
  created_at: string;
}

const initialCatalogProducts: CatalogProduct[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Real Madrid 2026/27 Home Jersey',
    slug: 'real-madrid-2026-27-home-jersey',
    description: 'Official Real Madrid 2026/27 Player Edition match jersey featuring HEAT.RDY technology, heat-bonded crest, and authentic athletic silhouette.',
    club: 'Real Madrid',
    category_id: 'cat-player-edition',
    edition: 'Player Edition',
    season: '2026/27',
    selling_price: 1800,
    compare_at_price: 2200,
    cost_price: 990,
    is_featured: true,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-rm-1', name: 'BELLINGHAM', number: 5 },
      { id: 'pl-rm-2', name: 'MBAPPE', number: 9 },
      { id: 'pl-rm-3', name: 'VINICIUS JR', number: 7 },
    ],
    customization_fee: 150,
    fabric_details: '100% Recycled Polyester HEAT.RDY Jacquard',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 4.9,
    review_count: 32,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Arsenal 2026/27 Home Jersey',
    slug: 'arsenal-2026-27-home-jersey',
    description: 'Official Arsenal FC 2026/27 Player Edition home kit with iconic cannon emblem, micro-mesh ventilation, and streamlined player fit.',
    club: 'Arsenal',
    category_id: 'cat-player-edition',
    edition: 'Player Edition',
    season: '2026/27',
    selling_price: 1750,
    compare_at_price: 2100,
    cost_price: 960,
    is_featured: true,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-ars-1', name: 'SAKA', number: 7 },
      { id: 'pl-ars-2', name: 'ODEGAARD', number: 8 },
      { id: 'pl-ars-3', name: 'RICE', number: 41 },
    ],
    customization_fee: 150,
    fabric_details: '100% Recycled Polyester Moisture-wicking Jacquard',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 4.9,
    review_count: 28,
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'FC Barcelona 2026/27 Home Jersey',
    slug: 'barcelona-2026-27-home-jersey',
    description: 'FC Barcelona 2026/27 Blaugrana Matchday Player Edition jersey with Dri-FIT ADV breathability and silicone badge.',
    club: 'FC Barcelona',
    category_id: 'cat-player-edition',
    edition: 'Player Edition',
    season: '2026/27',
    selling_price: 1800,
    compare_at_price: 2200,
    cost_price: 990,
    is_featured: false,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-bar-1', name: 'LAMINE YAMAL', number: 19 },
      { id: 'pl-bar-2', name: 'PEDRI', number: 8 },
      { id: 'pl-bar-3', name: 'GAVI', number: 6 },
    ],
    customization_fee: 150,
    fabric_details: '100% Dri-FIT ADV Technical Knit',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 5.0,
    review_count: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Manchester City 2026/27 Home Jersey',
    slug: 'manchester-city-2026-27-home-jersey',
    description: 'Manchester City 2026/27 Sky Blue Player Edition jersey engineered with ULTRAWEAVE lightweight performance fabric.',
    club: 'Manchester City',
    category_id: 'cat-player-edition',
    edition: 'Player Edition',
    season: '2026/27',
    selling_price: 1750,
    compare_at_price: 2100,
    cost_price: 960,
    is_featured: false,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: false,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-mc-1', name: 'HAALAND', number: 9 },
      { id: 'pl-mc-2', name: 'DE BRUYNE', number: 17 },
      { id: 'pl-mc-3', name: 'FODEN', number: 47 },
    ],
    customization_fee: 150,
    fabric_details: 'ULTRAWEAVE 4-way stretch structured weave',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 4.8,
    review_count: 19,
    created_at: new Date().toISOString(),
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Argentina 1986 Retro World Cup Jersey',
    slug: 'argentina-1986-retro-world-cup-jersey',
    description: 'Classic Diego Maradona 1986 Mexico World Cup winning retro kit. Embroidered AFA vintage crest with commemorative details.',
    club: 'Argentina',
    category_id: 'cat-retro',
    edition: 'Retro',
    season: '1986',
    selling_price: 1650,
    compare_at_price: 2000,
    cost_price: 900,
    is_featured: true,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: false,
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 4 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 4 },
    ],
    stock: 20,
    images: ['https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-arg-1', name: 'MARADONA', number: 10 },
    ],
    customization_fee: 150,
    fabric_details: 'Premium Heavyweight Retro Poly-Cotton blend',
    fit_type: 'Classic Relaxed Fit',
    status: 'active',
    rating: 5.0,
    review_count: 52,
    created_at: new Date().toISOString(),
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Brazil 2002 Retro World Cup Jersey',
    slug: 'brazil-2002-retro-world-cup-jersey',
    description: 'Iconic Penta 2002 Yokohama Final kit worn by Ronaldo Nazario and Ronaldinho. Double layer mesh design with five golden stars.',
    club: 'Brazil',
    category_id: 'cat-retro',
    edition: 'Retro',
    season: '2002',
    selling_price: 1650,
    compare_at_price: 2000,
    cost_price: 900,
    is_featured: false,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: false,
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 4 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 4 },
    ],
    stock: 20,
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-bra-1', name: 'RONALDO', number: 9 },
      { id: 'pl-bra-2', name: 'RONALDINHO', number: 11 },
    ],
    customization_fee: 150,
    fabric_details: 'Coolvent Double Layer Retro Mesh',
    fit_type: 'Classic Relaxed Fit',
    status: 'active',
    rating: 4.9,
    review_count: 38,
    created_at: new Date().toISOString(),
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'AC Milan 2007 Retro UCL Away Jersey',
    slug: 'ac-milan-2007-retro-ucl-away-jersey',
    description: 'Athens 2007 UEFA Champions League Final winning white jersey featuring Ballon d\'Or winner Kaká #22.',
    club: 'AC Milan',
    category_id: 'cat-retro',
    edition: 'Retro',
    season: '2007',
    selling_price: 1650,
    compare_at_price: 1950,
    cost_price: 900,
    is_featured: false,
    is_trending: false,
    is_bestseller: true,
    is_new_arrival: false,
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 4 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 4 },
    ],
    stock: 20,
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-mil-1', name: 'KAKA', number: 22 },
      { id: 'pl-mil-2', name: 'MALDINI', number: 3 },
    ],
    customization_fee: 150,
    fabric_details: 'Retro Silky Polyester with gold UCL starball patch',
    fit_type: 'Classic Regular Fit',
    status: 'active',
    rating: 5.0,
    review_count: 27,
    created_at: new Date().toISOString(),
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    name: 'Argentina 2026 World Cup Kit',
    slug: 'argentina-2026-world-cup-kit',
    description: 'Official defending champions Argentina 2026 World Cup edition featuring three golden stars and gold FIFA World Champions badge.',
    club: 'Argentina',
    category_id: 'cat-world-cup',
    edition: 'World Cup',
    season: '2026',
    selling_price: 1850,
    compare_at_price: 2250,
    cost_price: 1000,
    is_featured: true,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 6 },
      { size: 'M', stock: 6 },
      { size: 'L', stock: 6 },
      { size: 'XL', stock: 6 },
      { size: 'XXL', stock: 6 },
    ],
    stock: 30,
    images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-arg-26-1', name: 'MESSI', number: 10 },
      { id: 'pl-arg-26-2', name: 'ALVAREZ', number: 9 },
    ],
    customization_fee: 150,
    fabric_details: '100% Recycled Polyester HEAT.RDY',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 5.0,
    review_count: 64,
    created_at: new Date().toISOString(),
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    name: 'Portugal 2026 Matchday Kit',
    slug: 'portugal-2026-matchday-kit',
    description: 'Portugal 2026 tournament edition jersey with rich crimson and forest green detailing and gold federation crest.',
    club: 'Portugal',
    category_id: 'cat-world-cup',
    edition: 'World Cup',
    season: '2026',
    selling_price: 1800,
    compare_at_price: 2200,
    cost_price: 990,
    is_featured: false,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-por-1', name: 'RONALDO', number: 7 },
      { id: 'pl-por-2', name: 'BRUNO FERNANDES', number: 8 },
    ],
    customization_fee: 150,
    fabric_details: '100% Technical Engineered Poly',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 4.8,
    review_count: 22,
    created_at: new Date().toISOString(),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Manchester United 2026/27 Home Jersey',
    slug: 'manchester-united-2026-27-home-jersey',
    description: 'Manchester United 2026/27 Theatre of Dreams fan edition jersey. Comfortable daily cut with woven crest.',
    club: 'Manchester United',
    category_id: 'cat-fan-edition',
    edition: 'Fan Edition',
    season: '2026/27',
    selling_price: 1400,
    compare_at_price: 1700,
    cost_price: 770,
    is_featured: false,
    is_trending: true,
    is_bestseller: false,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-mu-1', name: 'FERNANDES', number: 8 },
      { id: 'pl-mu-2', name: 'RASHFORD', number: 10 },
      { id: 'pl-mu-3', name: 'GARNACHO', number: 17 },
    ],
    customization_fee: 150,
    fabric_details: '100% Recycled AEROREADY Breathable Polyester',
    fit_type: 'Standard Regular Fit',
    status: 'active',
    rating: 4.7,
    review_count: 15,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Liverpool 2026/27 Home Jersey',
    slug: 'liverpool-2026-27-home-jersey',
    description: 'Official Liverpool FC 2026/27 Anfield Player Edition red jersey with yellow pinstripe accents and 97 memorial crest.',
    club: 'Liverpool',
    category_id: 'cat-player-edition',
    edition: 'Player Edition',
    season: '2026/27',
    selling_price: 1750,
    compare_at_price: 2150,
    cost_price: 960,
    is_featured: false,
    is_trending: true,
    is_bestseller: true,
    is_new_arrival: false,
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 },
    ],
    stock: 25,
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-liv-1', name: 'SALAH', number: 11 },
      { id: 'pl-liv-2', name: 'VAN DIJK', number: 4 },
    ],
    customization_fee: 150,
    fabric_details: 'Dri-FIT ADV engineered knit',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 4.9,
    review_count: 31,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    name: 'France 2026 Matchday Kit',
    slug: 'france-2026-matchday-kit',
    description: 'Les Bleus 2026 match kit with heritage Gallic rooster crest and iridescent tricolor badge.',
    club: 'France',
    category_id: 'cat-world-cup',
    edition: 'World Cup',
    season: '2026',
    selling_price: 1800,
    compare_at_price: 2200,
    cost_price: 990,
    is_featured: false,
    is_trending: false,
    is_bestseller: false,
    is_new_arrival: true,
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 4 },
      { size: 'L', stock: 4 },
      { size: 'XL', stock: 4 },
      { size: 'XXL', stock: 4 },
    ],
    stock: 20,
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800'],
    available_players: [
      { id: 'pl-fra-1', name: 'MBAPPE', number: 10 },
      { id: 'pl-fra-2', name: 'GRIEZMANN', number: 7 },
    ],
    customization_fee: 150,
    fabric_details: '100% Recycled Technical Polyester',
    fit_type: 'Athletic Slim Fit',
    status: 'active',
    rating: 4.8,
    review_count: 14,
    created_at: new Date().toISOString(),
  },
];

const inMemoryCatalog = new Map<string, CatalogProduct>(
  initialCatalogProducts.map((p) => [p.id, JSON.parse(JSON.stringify(p))])
);

const inMemoryOrders: any[] = [];
const inMemoryIdempotencyKeys = new Map<string, any>();

// Helper to strip sensitive internal profit/cost fields from customer-facing order objects
function sanitizeOrder(order: any) {
  if (!order) return order;
  const sanitized = { ...order };
  delete sanitized.total_cost;
  delete sanitized.gross_profit;
  delete sanitized.profit_margin_percent;
  delete sanitized.admin_notes;

  if (Array.isArray(sanitized.order_items)) {
    sanitized.order_items = sanitized.order_items.map((item: any) => {
      const sanitizedItem = { ...item };
      delete sanitizedItem.cost_price;
      return sanitizedItem;
    });
  }

  return sanitized;
}

// Basic IP rate limiting for order submissions (allow loopback for automated verification, 60/min for external IPs)
const orderRateLimits = new Map<string, { count: number; resetTime: number }>();
function checkOrderRateLimit(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
    return true;
  }
  const now = Date.now();
  const record = orderRateLimits.get(ip);
  if (!record || now > record.resetTime) {
    orderRateLimits.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= 60) {
    return false;
  }
  record.count++;
  return true;
}

// In-flight concurrency lock to handle simultaneous identical idempotent requests
const inFlightOrders = new Map<string, Promise<{ status: number; body: any }>>();

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Categories catalog
app.get('/api/categories', async (req, res) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('categories').select('*').order('name', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json({ categories: data });
      }
    } catch {
      // Fallback
    }
  }

  return res.json({
    categories: [
      { id: 'cat-player-edition', name: 'Player Edition', slug: 'player-edition' },
      { id: 'cat-fan-edition', name: 'Fan Edition', slug: 'fan-edition' },
      { id: 'cat-retro', name: 'Retro', slug: 'retro' },
      { id: 'cat-special-edition', name: 'Special Edition', slug: 'special-edition' },
      { id: 'cat-world-cup', name: 'World Cup', slug: 'world-cup' },
    ],
  });
});

// Products catalog endpoint
app.get('/api/products', async (req, res) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*, category:categories(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json({ products: data });
      }
    } catch (e) {
      console.warn('Supabase products fetch failed, using catalog cache:', e);
    }
  }

  const products = Array.from(inMemoryCatalog.values()).filter((p) => p.status === 'active');
  return res.json({ products });
});

// Single product lookup
app.get('/api/products/:slugOrId', async (req, res) => {
  const param = String(req.params.slugOrId || '').trim();
  if (supabaseAdmin) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
      let query = supabaseAdmin.from('products').select('*, category:categories(*)').eq('status', 'active');
      query = isUuid ? query.eq('id', param) : query.eq('slug', param);
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return res.json({ product: data });
      }
    } catch {
      // Fallback
    }
  }

  const product =
    inMemoryCatalog.get(param) ||
    Array.from(inMemoryCatalog.values()).find((p) => p.slug === param || p.id === param);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json({ product });
});

// Track order (secure guest lookup by order number and phone)
app.get('/api/orders/track', async (req, res) => {
  try {
    const orderNumber = String(req.query.orderNumber || req.query.order_number || '').trim();
    const phone = String(req.query.phone || '').trim().replace(/\D/g, '');

    if (!orderNumber || !phone) {
      return res.status(400).json({ error: 'Order Number and Phone are required' });
    }

    let order: any = null;

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .ilike('order_number', orderNumber)
          .maybeSingle();

        if (!error && data) {
          order = data;
        }
      } catch {
        // Fallback to in-memory
      }
    }

    if (!order) {
      order = inMemoryOrders.find(
        (o) => o.order_number.toLowerCase() === orderNumber.toLowerCase()
      );
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dbPhone = String(order.customer_phone || '').replace(/\D/g, '');
    const cleanPhone = phone.slice(-8);

    if (!dbPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(dbPhone.slice(-8))) {
      return res.status(403).json({ error: 'Phone number does not match order record' });
    }

    return res.json({ order: sanitizeOrder(order) });
  } catch (err: any) {
    console.error('Error tracking order:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Lookup orders by customer phone number
app.get('/api/orders/phone/:phone', async (req, res) => {
  try {
    const cleanPhone = String(req.params.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      return res.status(400).json({ error: 'Valid phone number required (at least 8 digits)' });
    }

    let orders: any[] = [];

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .ilike('customer_phone', `%${cleanPhone.slice(-8)}%`)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          orders = data;
        }
      } catch {
        // Fallback
      }
    }

    if (orders.length === 0) {
      orders = inMemoryOrders.filter((o) => {
        const oPhone = String(o.customer_phone || '').replace(/\D/g, '');
        return oPhone.endsWith(cleanPhone.slice(-8));
      });
    }

    const sanitized = (orders || []).map(sanitizeOrder);
    return res.json({ orders: sanitized });
  } catch (err: any) {
    console.error('Error fetching orders by phone:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Lookup order by ID or order number
app.get('/api/orders/:idOrNumber', async (req, res) => {
  try {
    const idOrNumber = String(req.params.idOrNumber || '').trim();
    if (!idOrNumber) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    let order: any = null;

    if (supabaseAdmin) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
        let query = supabaseAdmin.from('orders').select('*, order_items(*)');
        if (isUuid) {
          query = query.or(`id.eq.${idOrNumber},order_number.ilike.${idOrNumber}`);
        } else {
          query = query.ilike('order_number', idOrNumber);
        }
        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          order = data;
        }
      } catch {
        // Fallback
      }
    }

    if (!order) {
      order = inMemoryOrders.find(
        (o) =>
          o.id === idOrNumber ||
          o.order_number.toLowerCase() === idOrNumber.toLowerCase()
      );
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order: sanitizeOrder(order) });
  } catch (err: any) {
    console.error('Error fetching order:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  // Data safety: in production / on Vercel, reject order creation if Supabase is not configured
  if (isProduction && (!isSupabaseConfigured || !supabaseAdmin)) {
    return res.status(503).json({
      error: 'Database service is currently unavailable. Orders cannot be processed without database configuration in production.',
    });
  }

  const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  if (!checkOrderRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many order requests. Please wait a moment and try again.' });
  }

  // 1. Extract and normalize idempotency key
  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotency_key || req.body.idempotencyKey;
  const idempotencyKey = typeof rawKey === 'string' ? rawKey.trim() : '';

  // 2. Handle race condition where two identical requests arrive simultaneously
  if (idempotencyKey && inFlightOrders.has(idempotencyKey)) {
    try {
      const inFlightResult = await inFlightOrders.get(idempotencyKey)!;
      return res.status(inFlightResult.status).json(inFlightResult.body);
    } catch (inFlightErr: any) {
      console.error('Error awaiting in-flight idempotent order:', inFlightErr);
      return res.status(500).json({ error: 'Order processing error during concurrent checkout attempt.' });
    }
  }

  // 3. Process order execution
  const executeOrder = async (): Promise<{ status: number; body: any }> => {
    // 3a. Check if order with this idempotency key already exists
    if (idempotencyKey) {
      if (inMemoryIdempotencyKeys.has(idempotencyKey)) {
        const cachedOrder = inMemoryIdempotencyKeys.get(idempotencyKey);
        return {
          status: 200,
          body: {
            success: true,
            order: sanitizeOrder(cachedOrder),
            duplicate: true,
          },
        };
      }

      if (supabaseAdmin) {
        try {
          const { data: idempRow } = await supabaseAdmin
            .from('order_idempotency_keys')
            .select('order_id, orders(*, order_items(*))')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();

          if (idempRow && idempRow.orders) {
            return {
              status: 200,
              body: {
                success: true,
                order: sanitizeOrder(idempRow.orders),
                duplicate: true,
              },
            };
          }
        } catch {
          // Continue
        }

        try {
          const { data: existingByNotes } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .ilike('admin_notes', `%[IDEMPOTENCY_KEY: ${idempotencyKey}]%`)
            .maybeSingle();

          if (existingByNotes) {
            return {
              status: 200,
              body: {
                success: true,
                order: sanitizeOrder(existingByNotes),
                duplicate: true,
              },
            };
          }
        } catch {
          // Continue to fresh creation
        }
      }
    }

    const {
      user_id,
      customer_name,
      customer_phone,
      customer_email,
      delivery_location,
      district,
      city_area,
      delivery_address,
      order_notes,
      items,
    } = req.body;

    // Strict input validation
    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
      return { status: 400, body: { error: 'A valid customer name (at least 2 characters) is required' } };
    }

    const cleanDigits = String(customer_phone || '').replace(/\D/g, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 15) {
      return { status: 400, body: { error: 'A valid customer phone number is required (8-15 digits)' } };
    }

    if (!delivery_address || typeof delivery_address !== 'string' || delivery_address.trim().length < 5) {
      return { status: 400, body: { error: 'A complete delivery address (at least 5 characters) is required' } };
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return { status: 400, body: { error: 'Order must contain between 1 and 50 items' } };
    }

    // Validate UUID format for all product IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const item of items) {
      if (!item.product_id || !uuidRegex.test(item.product_id)) {
        return { status: 400, body: { error: `Invalid product ID format: "${item.product_id}". Valid Supabase UUID required.` } };
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        return { status: 400, body: { error: 'Invalid quantity for item. Must be an integer between 1 and 100.' } };
      }
    }

    // Resolve products from Supabase or in-memory catalog
    const productIds = Array.from(new Set(items.map((i: any) => i.product_id)));
    let productMap = new Map<string, any>();

    if (supabaseAdmin) {
      try {
        const { data: dbProducts, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('status', 'active');

        if (!prodErr && Array.isArray(dbProducts)) {
          productMap = new Map(dbProducts.map((p: any) => [p.id, p]));
        }
      } catch (err) {
        console.warn('Could not query products from Supabase:', err);
      }
    }

    if (productMap.size === 0) {
      productIds.forEach((pid) => {
        if (inMemoryCatalog.has(pid as string)) {
          productMap.set(pid as string, inMemoryCatalog.get(pid as string));
        }
      });
    }

    // Check that every single ordered item exists in active products
    for (const item of items) {
      if (!productMap.has(item.product_id)) {
        return {
          status: 400,
          body: { error: `Product with ID ${item.product_id} was not found or is currently inactive in the catalog.` },
        };
      }
    }

    // Stock validation before placing order
    for (const item of items) {
      const dbProd = productMap.get(item.product_id)!;
      const requestedQty = Number(item.quantity) || 1;
      const requestedSize = String(item.size || 'M').toUpperCase();

      if (Array.isArray(dbProd.sizes) && dbProd.sizes.length > 0) {
        const sizeEntry = dbProd.sizes.find((s: any) => String(s.size).toUpperCase() === requestedSize);
        const availableStock = sizeEntry ? Number(sizeEntry.stock) || 0 : 0;
        if (availableStock < requestedQty) {
          return {
            status: 400,
            body: { error: `Insufficient stock for ${dbProd.name} in size ${requestedSize}. Available: ${availableStock}, requested: ${requestedQty}.` },
          };
        }
      } else {
        const availableStock = Number(dbProd.stock) || 0;
        if (availableStock < requestedQty) {
          return {
            status: 400,
            body: { error: `Insufficient stock for ${dbProd.name}. Available: ${availableStock}, requested: ${requestedQty}.` },
          };
        }
      }
    }

    let calculatedSubtotal = 0;
    let calculatedCustomizationTotal = 0;
    let calculatedTotalCost = 0;

    const validatedItems = items.map((item: any) => {
      const dbProd = productMap.get(item.product_id)!;
      const unitPrice = Number(dbProd.selling_price) || 0;
      const costPrice = Number(dbProd.cost_price) || Math.round(unitPrice * 0.55);
      const productName = dbProd.name || 'Football Jersey';
      const productSku = dbProd.slug || 'SKU-JERSEY';
      const productImage = Array.isArray(dbProd.images) && dbProd.images[0]
        ? dbProd.images[0]
        : (item.product_image || '');

      const isCustom = Boolean(item.player_name || item.player_number || item.is_custom);
      const customizationFee = isCustom ? Number(dbProd.customization_fee ?? 150) : 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const itemSubtotal = (unitPrice + customizationFee) * quantity;

      calculatedSubtotal += unitPrice * quantity;
      calculatedCustomizationTotal += customizationFee * quantity;
      calculatedTotalCost += (costPrice + (customizationFee * 0.4)) * quantity;

      return {
        product_id: dbProd.id,
        product_name: productName,
        product_sku: productSku,
        product_image: productImage,
        size: String(item.size || 'M').toUpperCase(),
        quantity,
        unit_price: unitPrice,
        cost_price: costPrice,
        customization_fee: customizationFee,
        custom_name: item.player_name ? String(item.player_name).trim().toUpperCase() : null,
        custom_number: item.player_number ? String(item.player_number).trim() : null,
        subtotal: itemSubtotal,
      };
    });

    const deliveryFee = delivery_location === 'outside' ? 130 : 70;
    const totalAmount = calculatedSubtotal + calculatedCustomizationTotal + deliveryFee;
    const grossProfit = Math.max(0, totalAmount - calculatedTotalCost);
    const profitMarginPercent = totalAmount > 0 ? Number(((grossProfit / totalAmount) * 100).toFixed(2)) : 0;

    // Generate unique human-readable order number: EN-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `EN-${dateStr}-${randomSuffix}`;

    const isCustomerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id || '');
    const adminNotesTag = idempotencyKey ? `[IDEMPOTENCY_KEY: ${idempotencyKey}]` : null;

    const orderPayload = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
      customer_id: isCustomerUuid ? user_id : null,
      customer_name: String(customer_name).trim(),
      customer_phone: String(customer_phone).trim(),
      customer_email: customer_email ? String(customer_email).trim() : null,
      shipping_address: String(delivery_address).trim(),
      city: String(city_area || district || 'Dhaka').trim(),
      postal_code: null,
      items_count: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: calculatedSubtotal,
      customization_total: calculatedCustomizationTotal,
      delivery_fee: deliveryFee,
      discount: 0,
      total_amount: totalAmount,
      total_cost: calculatedTotalCost,
      gross_profit: grossProfit,
      profit_margin_percent: profitMarginPercent,
      payment_method: 'cod',
      payment_status: 'pending',
      order_status: 'pending',
      courier_name: null,
      tracking_number: null,
      admin_notes: adminNotesTag,
      customer_notes: order_notes ? String(order_notes).trim() : null,
      is_custom_order: validatedItems.some((i) => i.customization_fee > 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const orderItemsPayload = validatedItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      order_id: orderPayload.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      product_image: item.product_image,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      customization_fee: item.customization_fee,
      player_name: item.custom_name,
      player_number: item.custom_number,
      subtotal: item.subtotal,
    }));

    // If Supabase RPC is operational, execute atomically in database
    if (supabaseAdmin) {
      try {
        const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('create_order_atomic', {
          order_payload: orderPayload,
          items_payload: orderItemsPayload,
        });

        if (!rpcErr && rpcResult?.order_id) {
          const { data: createdOrder } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', rpcResult.order_id)
            .single();

          if (createdOrder) {
            if (idempotencyKey) {
              try {
                await supabaseAdmin.from('order_idempotency_keys').insert({
                  idempotency_key: idempotencyKey,
                  order_id: createdOrder.id,
                });
              } catch {
                // Table may not exist yet
              }
            }
            return { status: 201, body: { success: true, order: sanitizeOrder(createdOrder) } };
          }
        } else if (rpcErr) {
          const errMsg = rpcErr.message || 'Database error occurred while processing order';
          if (errMsg.includes('Insufficient') || errMsg.includes('stock')) {
            return { status: 400, body: { error: errMsg } };
          }
          if (isProduction) {
            console.error('Supabase RPC error creating order in production:', errMsg);
            return {
              status: 503,
              body: { error: 'Database service temporarily unavailable. Order could not be persisted safely.' },
            };
          }
        }
      } catch (err: any) {
        if (isProduction) {
          console.error('Supabase order creation exception in production:', err?.message || 'Database error');
          return {
            status: 503,
            body: { error: 'Database service temporarily unavailable. Order could not be persisted safely.' },
          };
        }
        console.warn('Supabase order creation attempt failed, using in-memory store in dev:', err);
      }
    }

    // In production / Vercel, we must NEVER fall back to ephemeral in-memory storage
    if (isProduction) {
      return {
        status: 503,
        body: { error: 'Database service temporarily unavailable. Orders cannot be persisted safely.' },
      };
    }

    // Atomic in-memory stock deduction and creation (Local Development fallback only)
    for (const item of items) {
      const catProd = inMemoryCatalog.get(item.product_id);
      if (catProd) {
        const requestedQty = Number(item.quantity) || 1;
        const requestedSize = String(item.size || 'M').toUpperCase();
        if (Array.isArray(catProd.sizes)) {
          const sObj = catProd.sizes.find((s) => s.size.toUpperCase() === requestedSize);
          if (sObj) {
            sObj.stock = Math.max(0, sObj.stock - requestedQty);
          }
        }
        catProd.stock = Math.max(0, catProd.stock - requestedQty);
      }
    }

    const completeOrder = {
      ...orderPayload,
      order_items: orderItemsPayload,
    };

    inMemoryOrders.unshift(completeOrder);
    if (idempotencyKey) {
      inMemoryIdempotencyKeys.set(idempotencyKey, completeOrder);
    }

    return { status: 201, body: { success: true, order: sanitizeOrder(completeOrder) } };
  };

  // 5. Register in-flight promise and execute
  const executePromise = executeOrder();
  if (idempotencyKey) {
    inFlightOrders.set(idempotencyKey, executePromise);
  }

  try {
    const result = await executePromise;
    return res.status(result.status).json(result.body);
  } catch (err: any) {
    console.error('Server order creation exception:', err);
    return res.status(500).json({ error: 'An error occurred while creating the order' });
  } finally {
    if (idempotencyKey) {
      inFlightOrders.delete(idempotencyKey);
    }
  }
});

// ============================================================================
// SITEMAP & ROBOTS.TXT
// ============================================================================

function getDistIndexPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'dist/index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, '../dist/index.html'),
    path.join(process.cwd(), 'index.html'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getRobotsTxtPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'robots.txt'),
    path.join(__dirname, 'public', 'robots.txt'),
    path.join(__dirname, '..', 'public', 'robots.txt'),
    path.join(process.cwd(), 'dist', 'robots.txt'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getRequestPath(req: express.Request): string {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && matchedPath.length > 0) {
    return matchedPath.split('?')[0];
  }
  const forwardedUrl = req.headers['x-forwarded-url'];
  if (typeof forwardedUrl === 'string') {
    try {
      const u = forwardedUrl.startsWith('http') ? new URL(forwardedUrl) : new URL(`http://localhost${forwardedUrl}`);
      return u.pathname;
    } catch {}
  }
  return (req.originalUrl || req.path || '').split('?')[0];
}

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const robotsPath = getRobotsTxtPath();
  if (robotsPath && fs.existsSync(robotsPath)) {
    res.type('text/plain').sendFile(robotsPath);
  } else {
    res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /track-order\nDisallow: /checkout\nDisallow: /account\nDisallow: /cart\nDisallow: /api/\n\nSitemap: https://www.elevennation.shop/sitemap.xml\n');
  }
});

// Dynamic sitemap.xml with home, shop, and all product pages (new path URLs, www domain)
app.get('/sitemap.xml', async (req, res) => {
  try {
    let productsList: any[] = [];
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('status', 'active');
        if (!error && Array.isArray(data) && data.length > 0) {
          productsList = data;
        }
      } catch {
        // Fallback to in-memory catalog
      }
    }

    if (productsList.length === 0) {
      productsList = Array.from(inMemoryCatalog.values()).filter((p) => p.status === 'active');
    }

    const today = new Date().toISOString().slice(0, 10);
    const staticRoutes = [
      { loc: 'https://www.elevennation.shop/', priority: '1.0', changefreq: 'daily' },
      { loc: 'https://www.elevennation.shop/shop', priority: '0.9', changefreq: 'daily' },
      { loc: 'https://www.elevennation.shop/clubs', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://www.elevennation.shop/players', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://www.elevennation.shop/size-guide', priority: '0.5', changefreq: 'monthly' },
      { loc: 'https://www.elevennation.shop/exchange-policy', priority: '0.5', changefreq: 'monthly' },
    ];

    const xmlEntries = [
      ...staticRoutes.map((r) => `  <url>
    <loc>${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`),
      ...productsList.map((p) => {
        const lastMod = (p.updated_at || p.created_at || today).slice(0, 10);
        const encodedSlug = encodeURI(String(p.slug || '').trim());
        return `  <url>
    <loc>https://www.elevennation.shop/product/${encodedSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>`.trim();

    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap:', err);
    return res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

// ============================================================================
// HTML RENDERING & CRAWLER SEO INJECTION
// ============================================================================
const FILE_EXT_REGEX = /\.(ico|png|jpe?g|svg|xml|txt|webmanifest|json|js|css|map|woff2?|ttf|eot|webp|avif|html)$/i;

async function renderHtml(req: express.Request, rawHtml: string): Promise<string> {
  let html = rawHtml;
  const reqPath = getRequestPath(req);

  // Handle /product/:slug injection
  if (reqPath.startsWith('/product/')) {
    const slug = reqPath.replace(/^\/product\//, '').split('/')[0];
    let product: any = null;

    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();
        if (data) product = data;
      } catch {}
    }

    if (!product) {
      product =
        inMemoryCatalog.get(slug) ||
        Array.from(inMemoryCatalog.values()).find((p) => p.slug === slug || p.id === slug);
    }

    if (product) {
      const title = `${product.name} | Eleven Nation Bangladesh`;
      const description = `Buy authentic ${product.name} (${product.edition}). Premium matchday specifications, custom name & number printing available. BDT ${product.selling_price}.`;
      const canonicalUrl = `https://www.elevennation.shop/product/${product.slug}`;
      const imageUrl = Array.isArray(product.images) && product.images[0]
        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].image_url)
        : 'https://www.elevennation.shop/og-image.png';

      const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: Array.isArray(product.images) ? product.images : [imageUrl],
        description: product.description || `Official ${product.name} football jersey`,
        sku: product.slug,
        brand: {
          '@type': 'Brand',
          name: 'Eleven Nation',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'BDT',
          price: product.selling_price,
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };

      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
      html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`);
      html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${description}" />`);
      html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
      html = html.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${imageUrl}" />`);
      html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${title}" />`);
      html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${description}" />`);
      html = html.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${imageUrl}" />`);

      const jsonLdScript = `\n    <script type="application/ld+json">\n    ${JSON.stringify(jsonLd, null, 2)}\n    </script>`;
      html = html.replace('</head>', `${jsonLdScript}\n  </head>`);
      return html;
    }
  }

  // Handle other top routes
  if (reqPath === '/shop') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Shop Football Jerseys &amp; Kits | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Shop official 2026/27 Player Editions, Fan Kits, and Retro Classics. Custom heat-press printing available with Cash on Delivery nationwide in Bangladesh." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/shop" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/shop" />`);
  } else if (reqPath === '/clubs') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Shop by Club &amp; Teams | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/clubs" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/clubs" />`);
  } else if (reqPath === '/players') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Star Players Roster | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Choose your superstar or customize your kit with official matchday name & number heat-press printing in Bangladesh." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/players" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/players" />`);
  } else if (reqPath === '/track-order') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Track Your Order | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Live tracking for your Eleven Nation jersey order with order number and phone verification. Fast delivery across all 64 districts." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/track-order" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/track-order" />`);
  } else if (reqPath === '/checkout') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Checkout &amp; Delivery | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Complete your football jersey purchase with Cash on Delivery across all 64 districts in Bangladesh." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/checkout" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/checkout" />`);
  } else if (reqPath === '/wishlist') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Saved Jerseys | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Your personal Eleven Nation jersey wishlist. Save favorite matchday kits and custom editions." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/wishlist" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/wishlist" />`);
  } else if (reqPath === '/account') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Customer Account | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Manage your Eleven Nation orders, profile details, and delivery addresses." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/account" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/account" />`);
  } else if (reqPath === '/size-guide') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Jersey Size &amp; Fit Guide | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Find your perfect fit. Compare Player Edition athletic slim cut vs Fan Edition regular fit measurements in inches." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/size-guide" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/size-guide" />`);
  } else if (reqPath === '/exchange-policy') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Exchange &amp; Return Policy | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Hassle-free 7-day size exchange and authentic return guarantee for football kits across Bangladesh." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/exchange-policy" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/exchange-policy" />`);
  } else if (reqPath === '/retro') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>Retro Football Jerseys &amp; Classic Kits | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Iconic vintage football kits and retro player shirts in Bangladesh. Authentic retro styling." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/retro" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/retro" />`);
  } else if (reqPath === '/worldcup') {
    html = html.replace(/<title>.*?<\/title>/i, `<title>World Cup &amp; International Kits | Eleven Nation Bangladesh</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Official international national team jerseys for World Cup and Copa America in Bangladesh." />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="https://www.elevennation.shop/worldcup" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="https://www.elevennation.shop/worldcup" />`);
  }

  return html;
}

// ============================================================================
// STATIC SERVING, VERCEL SERVERLESS & DEV SERVER HANDLING
// ============================================================================
const publicPath = path.join(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

if (isProduction) {
  // Production / Vercel Catch-All: reads built dist/index.html and injects SEO tags
  app.get('*', async (req, res) => {
    const targetPath = getRequestPath(req);
    // If request has a file extension and was not found in static assets, respond 404
    if (FILE_EXT_REGEX.test(targetPath)) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    const indexPath = getDistIndexPath();
    if (indexPath && fs.existsSync(indexPath)) {
      const rawHtml = fs.readFileSync(indexPath, 'utf-8');
      const finalHtml = await renderHtml(req, rawHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
    } else {
      res.status(404).type('text/plain').send('Not Found: index.html not found');
    }
  });

  // Local standalone production server (only if not running inside Vercel serverless)
  if (!isVercel) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Eleven Nation Shop running in production at http://0.0.0.0:${PORT}`);
    });
  }
} else {
  // Local development mode with dynamic Vite import
  (async () => {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
      });
      app.use(vite.middlewares);

      app.get('*', async (req, res, next) => {
        const targetPath = (req.originalUrl || req.path || '').split('?')[0];
        if (FILE_EXT_REGEX.test(targetPath)) {
          return res.status(404).type('text/plain').send('Not Found');
        }

        try {
          const indexPath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          const finalHtml = await renderHtml(req, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Eleven Nation Shop running in dev at http://0.0.0.0:${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start Vite dev server:', err);
    }
  })();
}

export { app };
export default app;
