import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use('/api', express.json());

const angularApp = new AngularNodeAppEngine();

// --- IN-MEMORY DATABASE ---
let tables = [
  { id: 1, number: '1', status: 'available', capacity: 2 },
  { id: 2, number: '2', status: 'occupied', capacity: 4 },
  { id: 3, number: '3', status: 'available', capacity: 4 },
  { id: 4, number: '4', status: 'dirty', capacity: 6 },
  { id: 5, number: '5', status: 'occupied', capacity: 2 },
  { id: 6, number: '6', status: 'available', capacity: 8 },
  { id: 7, number: '7', status: 'available', capacity: 4 },
  { id: 8, number: '8', status: 'dirty', capacity: 2 },
];

let categories = [
  { id: 1, name: 'Entradas', icon: 'tapas' },
  { id: 2, name: 'Platos Fuertes', icon: 'restaurant' },
  { id: 3, name: 'Bebidas', icon: 'local_bar' },
  { id: 4, name: 'Postres', icon: 'cake' }
];

let dishes = [
  { id: 1, name: 'Nachos Supremos', price: 8.50, categoryId: 1, available: true, imageIcon: '🧀' },
  { id: 2, name: 'Alitas BBQ', price: 10.00, categoryId: 1, available: true, imageIcon: '🍗' },
  { id: 3, name: 'Hamburguesa Clásica', price: 12.50, categoryId: 2, available: true, imageIcon: '🍔' },
  { id: 4, name: 'Pizza Margarita', price: 14.00, categoryId: 2, available: true, imageIcon: '🍕' },
  { id: 5, name: 'Limonada Natural', price: 3.00, categoryId: 3, available: true, imageIcon: '🍋' },
  { id: 6, name: 'Cerveza Artesanal', price: 5.00, categoryId: 3, available: true, imageIcon: '🍺' },
  { id: 7, name: 'Cheesecake', price: 6.50, categoryId: 4, available: true, imageIcon: '🍰' },
];

// Active orders per table (tableId -> Order)
const activeOrders = new Map<number, any>();

// Mock some initial orders for occupied tables
activeOrders.set(2, {
  tableId: 2,
  items: [
    { dish: dishes[2], quantity: 2, notes: '' },
    { dish: dishes[5], quantity: 2, notes: '' }
  ]
});
activeOrders.set(5, {
  tableId: 5,
  items: [
    { dish: dishes[3], quantity: 1, notes: 'Sin aceitunas' },
    { dish: dishes[4], quantity: 1, notes: '' }
  ]
});

// --- API ENDPOINTS ---

// Auth
app.post('/api/auth/register', (req, res) => {
  const { username, password, role, pin } = req.body;
  // Mock registration
  res.json({ token: 'mock-jwt-token-123', username, role: role || 'ROLE_WAITER' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    res.json({ token: 'mock-jwt-token-admin', username: 'admin', role: 'ROLE_ADMIN' });
  } else {
    res.json({ token: 'mock-jwt-token-waiter', username: username || 'mesero1', role: 'ROLE_WAITER' });
  }
});

app.post('/api/auth/login/pin', (req, res) => {
  const { pin } = req.body;
  if (pin === '1234') {
    res.json({ token: 'mock-jwt-token-admin', username: 'admin', role: 'ROLE_ADMIN' });
  } else if (pin === '1111') {
    res.json({ token: 'mock-jwt-token-waiter', username: 'mesero1', role: 'ROLE_WAITER' });
  } else {
    res.status(401).json({ error: 'PIN incorrecto' });
  }
});

// Tables
app.get('/api/tables', (req, res) => {
  res.json(tables);
});

app.patch('/api/tables/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const table = tables.find(t => t.id === id);
  if (table) {
    table.status = status;
    res.json(table);
  } else {
    res.status(404).json({ error: 'Table not found' });
  }
});

// Menu
app.get('/api/menu/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/menu/dishes/available', (req, res) => {
  res.json(dishes.filter(d => d.available));
});

// Orders
app.post('/api/orders', (req, res) => {
  const orderReq = req.body;
  const tableId = orderReq.tableId;
  
  // Populate full dish info for the order
  const populatedItems = orderReq.items.map((item: any) => {
    const dish = dishes.find(d => d.id === item.dishId);
    return { dish, quantity: item.quantity, notes: item.notes };
  });

  // Merge with existing order if table already has one, or create new
  if (activeOrders.has(tableId)) {
    const existingOrder = activeOrders.get(tableId);
    existingOrder.items.push(...populatedItems);
  } else {
    activeOrders.set(tableId, { tableId, items: populatedItems });
  }

  // Update table status
  const table = tables.find(t => t.id === tableId);
  if (table) table.status = 'occupied';

  res.json({ id: Date.now(), status: 'PENDING', message: 'Order received' });
});

// Billing
app.get('/api/billing/table/:id', (req, res) => {
  const tableId = parseInt(req.params.id);
  const order = activeOrders.get(tableId);
  
  if (!order) {
    res.status(404).json({ error: 'No active order for this table' });
    return;
  }

  const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.dish.price * item.quantity), 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  res.json({
    tableId,
    items: order.items,
    subtotal,
    tax,
    total
  });
});

app.post('/api/billing/table/:id/pay', (req, res) => {
  const tableId = parseInt(req.params.id);
  const { paymentMethod } = req.body;
  
  if (!activeOrders.has(tableId)) {
    res.status(404).json({ error: 'No active order for this table' });
    return;
  }

  // Clear the order
  activeOrders.delete(tableId);

  // Mark table as dirty
  const table = tables.find(t => t.id === tableId);
  if (table) table.status = 'dirty';

  res.json({ success: true, message: 'Payment processed successfully', paymentMethod });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
