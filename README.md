# D&G Store

D&G Store is a React Native shopping app with a local Express + SQLite API. It supports guest product browsing, authenticated checkout and order history, and owner inventory/customer administration.

## Run locally

Install mobile and server dependencies:

```powershell
npm install
Set-Location server
npm install
Set-Location ..
```

Start the API in one terminal:

```powershell
npm run server
```

The API listens on `http://localhost:3001`. Android emulators reach the host through `http://10.0.2.2:3001`, already configured in `src/api/client.ts`.

Start Metro in a second terminal:

```powershell
npm start
```

Install and launch Android from a third terminal:

```powershell
npm run android -- --no-packager
```

## Demo accounts

The first server start seeds `server/data/dgstore.sqlite`.

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@dgstore.rw` | `Owner123!` |
| Customer | `student@dgstore.rw` | `Student123!` |

## Customer experience

Guests can browse the home page, search/filter products, inspect details, and build a local cart. Login is required only when proceeding to checkout. Authenticated customers can place orders, review order history and tracking details, and manage their profile.

## Owner experience

Owners can view dashboard revenue/order/customer statistics, update order statuses, create or deactivate products, manage inventory, and view customer order/spend summaries.

## API

The backend preserves the client contract:

- `GET /products`
- `POST /auth/register`
- `POST /auth/login`
- `GET|POST /cart`
- `POST /orders`
- `GET /orders`
- `GET /admin/stats`
- `GET|POST /admin/products`
- `DELETE /admin/products/:id`
- `GET /admin/customers`
- `GET /admin/orders`
- `PATCH /admin/orders/:id/status`

Run the backend smoke test:

```powershell
Set-Location server
npm test
```

Payment methods are currently represented as checkout order methods (`momo`, `airtel`, and `card`). A real payment provider can be added behind the order endpoint without changing the customer UI contract.
