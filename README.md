# BankRecharge

BankRecharge is a standalone full-stack digital wallet and recharge simulation built with React, Node.js, Express and the official MongoDB Node.js driver.

## What this project demonstrates

- React UI with protected application flow
- JWT authentication
- bcrypt password hashing
- MongoDB native-driver CRUD operations
- Persistent wallet balances
- Atomic wallet funding/debit operations
- Transaction history
- Airtime/data recharge simulation
- Input validation on the server
- Loading, success and error states on the client
- Responsive dashboard
- Environment-based API/database configuration

## Important MongoDB driver fix

This project is written for the modern MongoDB Node.js driver. `findOneAndUpdate()` returns the updated document directly when `includeResultMetadata` is not enabled. The application therefore uses:

const wallet = await collection.findOneAndUpdate(...);

## Project structure

```text
BankRecharge-MongoDB-Edition/
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/auth.js
│   │   ├── routes/auth.routes.js
│   │   ├── routes/wallet.routes.js
│   │   ├── routes/recharge.routes.js
│   │   ├── utils/jwt.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## 1. Backend setup

```bash
cd server
npm install


Create `server/.env` from `.env.example`:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/
MONGODB_DB_NAME=bankrecharge
JWT_SECRET=use_a_long_random_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

Test:

```text
http://localhost:5000/api/health
```

## 2. Frontend setup

Open a second terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start React:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## 3. Test flow

1. Create an account.
2. Sign out.
3. Sign back in.
4. Confirm the dashboard loads with a ₦0 balance.
5. Fund the wallet with at least ₦100.
6. Confirm the balance updates.
7. Buy airtime/data with a valid Nigerian phone number.
8. Confirm the balance decreases.
9. Confirm both operations appear in Recent transactions.
10. Refresh the browser and confirm the data remains persisted in MongoDB.

## Async/await requirement

The application uses `async`/`await` for asynchronous API, MongoDB and server startup operations.

## Important

This is a portfolio simulation. It does not move real money and does not connect to a real bank, payment processor or telecommunications provider.

A production financial product would additionally require payment-provider integration, idempotency, rate limiting, audit controls, secure secrets management, monitoring, fraud controls and applicable KYC/AML/regulatory processes.
