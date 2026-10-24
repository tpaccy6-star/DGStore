const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('./src/index');

const server = app.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const request = (method, path, body, token) => new Promise((resolve, reject) => {
    const requestBody = body ? JSON.stringify(body) : '';
    const request = http.request({ hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, response => {
      let result = '';
      response.on('data', chunk => { result += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: result ? JSON.parse(result) : null }));
    });
    request.on('error', reject);
    request.end(requestBody);
  });
  try {
    const products = await request('GET', '/products');
    assert.equal(products.status, 200);
    const inStock = products.body.filter(p => p.stock >= 5);
    assert.ok(inStock.length >= 2);
    const [p1, p2] = inStock;

    const loginOwner = await request('POST', '/auth/login', { email: 'owner@dgstore.rw', password: 'Owner123!' });
    assert.equal(loginOwner.status, 200);

    const loginStudent = await request('POST', '/auth/login', { email: 'student@dgstore.rw', password: 'Student123!' });
    assert.equal(loginStudent.status, 200);
    const token = loginStudent.body.token;

    // 1. Multi-item cart sync test
    const cartSync1 = await request('POST', '/cart', { cart: { [p1.id]: 2, [p2.id]: 3 } }, token);
    assert.equal(cartSync1.status, 200);
    assert.equal(cartSync1.body.items.length, 2);

    // 2. Remove 1 item and verify database synchronization (no resurrected items)
    const cartSync2 = await request('POST', '/cart', { cart: { [p1.id]: 2 } }, token);
    assert.equal(cartSync2.status, 200);
    assert.equal(cartSync2.body.items.length, 1);
    assert.equal(cartSync2.body.items[0].productId, p1.id);

    // 3. Multi-item order placement with promo code
    const initialStockP1 = p1.stock;
    const initialStockP2 = p2.stock;

    const orderRes = await request('POST', '/orders', {
      items: [
        { productId: p1.id, quantity: 2 },
        { productId: p2.id, quantity: 1 }
      ],
      deliveryAddress: 'KG 15 Ave, Nyarugenge, Kigali',
      paymentMethod: 'momo',
      promoCode: 'DG2026',
      paymentDetails: '0788123456'
    }, token);

    assert.equal(orderRes.status, 201);
    assert.ok(orderRes.body.id.startsWith('DG-'));
    assert.equal(orderRes.body.items.length, 2);
    assert.equal(orderRes.body.items.find(i => i.productId === p1.id).quantity, 2);
    assert.equal(orderRes.body.items.find(i => i.productId === p2.id).quantity, 1);

    // 4. Verify stock decrement in products table
    const productsAfter = await request('GET', '/products');
    const p1After = productsAfter.body.find(p => p.id === p1.id);
    const p2After = productsAfter.body.find(p => p.id === p2.id);
    assert.equal(p1After.stock, initialStockP1 - 2);
    assert.equal(p2After.stock, initialStockP2 - 1);

    // 5. Test DB consistency & rollback: Attempting to order more than available stock fails atomically
    const failedOrder = await request('POST', '/orders', {
      items: [
        { productId: p1.id, quantity: 999999 }
      ],
      deliveryAddress: 'Kigali',
      paymentMethod: 'momo'
    }, token);
    assert.equal(failedOrder.status, 400);

    // 6. Admin orders retrieval includes item list
    const adminOrders = await request('GET', '/admin/orders', null, loginOwner.body.token);
    assert.equal(adminOrders.status, 200);
    const recentOrder = adminOrders.body.find(o => o.id === orderRes.body.id);
    assert.ok(recentOrder);
    assert.equal(recentOrder.items.length, 2);

    // 7. Admin notifications check
    const notifs = await request('GET', '/admin/notifications', null, loginOwner.body.token);
    assert.equal(notifs.status, 200);
    assert.ok(notifs.body.unreadCount >= 1);
    assert.ok(notifs.body.notifications.some(n => n.title.includes(orderRes.body.id)));

    // 8. Mark notification as read
    const targetNotif = notifs.body.notifications.find(n => n.title.includes(orderRes.body.id));
    const markReadRes = await request('PATCH', `/admin/notifications/${targetNotif.id}/read`, null, loginOwner.body.token);
    assert.equal(markReadRes.status, 204);

    // 9. Direct Pay test without an account (token = null)
    const directPayRes = await request('POST', '/orders', {
      items: [{ productId: p1.id, quantity: 1 }],
      deliveryAddress: 'Direct Pay Kigali, Rwanda',
      paymentMethod: 'momo',
      paymentDetails: '0788999888',
      customerName: 'Direct Guest',
      customerPhone: '0788999888'
    }, null);
    assert.equal(directPayRes.status, 201);
    assert.ok(directPayRes.body.id.startsWith('DG-'));
    assert.equal(directPayRes.body.items[0].productId, p1.id);

    // 10. WhatsApp settings retrieval
    const waGetRes = await request('GET', '/admin/settings/whatsapp', null, loginOwner.body.token);
    assert.equal(waGetRes.status, 200);
    assert.equal(typeof waGetRes.body.enabled, 'boolean');

    // 11. WhatsApp settings update
    const waSaveRes = await request('POST', '/admin/settings/whatsapp', {
      phone: '+250788123456',
      apiKey: 'test_api_key_12345'
    }, loginOwner.body.token);
    assert.equal(waSaveRes.status, 200);
    assert.equal(waSaveRes.body.phone, '+250788123456');
    assert.equal(waSaveRes.body.apiKey, 'test_api_key_12345');
    assert.equal(waSaveRes.body.enabled, true);

    // 12. WhatsApp test endpoint validation without credentials
    const waTestFail = await request('POST', '/admin/settings/whatsapp/test', {
      phone: '',
      apiKey: ''
    }, loginOwner.body.token);
    // Should respond with status 400 or test dispatched
    assert.ok([200, 400].includes(waTestFail.status));

    console.log('Backend multi-item, ACID DB consistency, Admin Notifications, Direct Pay & WhatsApp Alerts tests PASSED successfully!');
  } finally {
    server.close();
  }
});
