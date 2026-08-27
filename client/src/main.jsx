import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "bankrecharge_token";
const USER_KEY = "bankrecharge_user";

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
}

function Auth({ register = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <form className="authCard" onSubmit={submit}>
        <div className="logoBox">B</div>
        <span className="eyebrow">BANKRECHARGE</span>
        <h1>{register ? "Create your wallet" : "Welcome back"}</h1>
        <p>Secure demo wallet for everyday digital services.</p>

        {register && (
          <label>
            Name
            <input
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
        )}

        <label>
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
        </button>

        <small>
          {register ? "Already have an account?" : "New here?"} {" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </small>
      </form>
    </main>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "{}") || {};
    } catch {
      return {};
    }
  });
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [fundAmount, setFundAmount] = useState("");
  const [recharge, setRecharge] = useState({
    serviceType: "airtime",
    network: "MTN",
    phone: "",
    amount: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [recharging, setRecharging] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [walletResponse, transactionResponse, meResponse] =
        await Promise.all([
          api("/wallet"),
          api("/wallet/transactions"),
          api("/auth/me"),
        ]);

      setWallet(walletResponse.wallet || { balance: 0, currency: "NGN" });
      setTransactions(transactionResponse.transactions || []);
      setUser(meResponse.user || {});
      localStorage.setItem(USER_KEY, JSON.stringify(meResponse.user || {}));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadDashboard();
    };

    initialize();
  }, []);

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    navigate("/login", { replace: true });
  };

  const fundWallet = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setFunding(true);

    try {
      const data = await api("/wallet/fund", {
        method: "POST",
        body: JSON.stringify({ amount: Number(fundAmount) }),
      });

      setWallet(data.wallet || { balance: 0 });
      setFundAmount("");
      setMessage(data.message || "Wallet funded successfully.");
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    } finally {
      setFunding(false);
    }
  };

  const completeRecharge = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setRecharging(true);

    try {
      const data = await api("/recharge", {
        method: "POST",
        body: JSON.stringify({
          ...recharge,
          amount: Number(recharge.amount),
        }),
      });

      setWallet(data.wallet || { balance: 0 });
      setRecharge((current) => ({ ...current, phone: "", amount: "" }));
      setMessage(data.message || "Recharge completed successfully.");
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    } finally {
      setRecharging(false);
    }
  };

  const updateRecharge = (field, value) => {
    setRecharge((current) => ({ ...current, [field]: value }));
  };

  const firstName = user?.name?.trim()?.split(" ")[0] || "there";
  const balance = Number(wallet?.balance || 0);

  return (
    <div className="shell">
      <aside>
        <div>
          <div className="brand">
            <b>B</b>
            <span>
              <strong>BankRecharge</strong>
              <small>Digital wallet</small>
            </span>
          </div>

          <nav>
            <a href="#overview">Overview</a>
            <a href="#services">Recharge</a>
            <a href="#transactions">Transactions</a>
          </nav>
        </div>

        <button className="logout" type="button" onClick={signOut}>
          Sign out
        </button>
      </aside>

      <main className="main">
        <header>
          <div>
            <span className="eyebrow">PERSONAL WALLET</span>
            <h1>Good day, {firstName}.</h1>
          </div>
          <div className="user">{user?.email || ""}</div>
        </header>

        {(message || error) && (
          <div className={error ? "error" : "success"}>
            {error || message}
          </div>
        )}

        <section id="overview" className="grid">
          <article className="balance">
            <span>Available balance</span>
            <strong>
              {loading ? "Loading..." : `₦${balance.toLocaleString()}`}
            </strong>
            <small>NGN wallet · Demo environment</small>
          </article>

          <article className="card">
            <span className="eyebrow">QUICK FUND</span>
            <h2>Add money</h2>
            <form className="row" onSubmit={fundWallet}>
              <input
                required
                type="number"
                min="100"
                step="1"
                placeholder="Amount"
                value={fundAmount}
                onChange={(event) => setFundAmount(event.target.value)}
              />
              <button type="submit" disabled={funding}>
                {funding ? "Funding..." : "Fund wallet"}
              </button>
            </form>
          </article>
        </section>

        <section id="services" className="grid">
          <article className="card">
            <span className="eyebrow">EVERYDAY SERVICES</span>
            <h2>Buy airtime or data</h2>

            <form onSubmit={completeRecharge}>
              <div className="tabs">
                <button
                  type="button"
                  className={recharge.serviceType === "airtime" ? "sel" : ""}
                  onClick={() => updateRecharge("serviceType", "airtime")}
                >
                  Airtime
                </button>
                <button
                  type="button"
                  className={recharge.serviceType === "data" ? "sel" : ""}
                  onClick={() => updateRecharge("serviceType", "data")}
                >
                  Data
                </button>
              </div>

              <label>
                Network
                <select
                  value={recharge.network}
                  onChange={(event) =>
                    updateRecharge("network", event.target.value)
                  }
                >
                  <option>MTN</option>
                  <option>Airtel</option>
                  <option>Glo</option>
                  <option>9mobile</option>
                </select>
              </label>

              <label>
                Phone
                <input
                  required
                  value={recharge.phone}
                  onChange={(event) =>
                    updateRecharge("phone", event.target.value)
                  }
                  placeholder="08012345678"
                />
              </label>

              <label>
                Amount
                <input
                  required
                  type="number"
                  min="100"
                  step="1"
                  value={recharge.amount}
                  onChange={(event) =>
                    updateRecharge("amount", event.target.value)
                  }
                  placeholder="1000"
                />
              </label>

              <button type="submit" disabled={recharging}>
                {recharging ? "Processing..." : "Complete recharge"}
              </button>
            </form>
          </article>

          <article id="transactions" className="card">
            <span className="eyebrow">ACTIVITY</span>
            <h2>Recent transactions</h2>

            <div className="transactions">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div className="tx" key={transaction._id}>
                    <span className={transaction.direction}>
                      {transaction.direction === "credit" ? "+" : "−"}
                    </span>
                    <div>
                      <strong>{transaction.description}</strong>
                      <small>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <b className={transaction.direction}>
                      {transaction.direction === "credit" ? "+" : "−"}
                      ₦{Number(transaction.amount || 0).toLocaleString()}
                    </b>
                  </div>
                ))
              ) : (
                <p>No transactions yet.</p>
              )}
            </div>
          </article>
        </section>

        <footer>
          BankRecharge · React + Express + MongoDB native driver
        </footer>
      </main>
    </div>
  );
}

function App() {
  const { pathname } = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);

  if (pathname === "/login") {
    return <Auth />;
  }

  if (pathname === "/register") {
    return <Auth register />;
  }

  if (!token) {
    return <Auth />;
  }

  return <Dashboard />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
