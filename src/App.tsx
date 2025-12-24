import { useState, useEffect } from "react";
import styles from "./App.module.css";
import Dashboard from "./components/dashboard/Dashboard";
import TransactionForm from "./components/transactions/TransactionForm";
import TransactionsTable from "./components/transactions/TransactionsTable";
import Auth from "./components/auth/Auth";
import Budget from "./components/budget/Budget";
import Goals from "./components/goals/Goals";
import Insights from "./components/insights/Insights";
import Chatbot from "./components/chatbot/Chatbot";
import Predictions from "./components/predictions/Predictions";
import { useAuthStore, initializeAuthListener } from "./store/authStore";
import { useThemeStore, initializeTheme } from "./store/themeStore";
import { useTransactionsStore } from "./store/transactionsStore";
import { useAccountsStore } from "./store/accountsStore";
import { exportToCSV, exportToPDF } from "./utils/exportUtils";

type View =
  | "dashboard"
  | "transactions"
  | "add"
  | "budget"
  | "goals"
  | "insights"
  | "chatbot"
  | "predictions";

function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { user, loading, initialized, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const getActualTransactions = useTransactionsStore((s) => s.getActualTransactions);
  const currencies = useAccountsStore((s) => s.currencies);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    initializeTheme();
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error handled by store
    }
  };

  const handleExportCSV = () => {
    const transactions = getActualTransactions();
    exportToCSV(transactions, `finance-tracker-${new Date().toISOString().split("T")[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const transactions = getActualTransactions();
    const expenses = transactions.filter((t) => t.type === "expense");
    const income = transactions.filter((t) => t.type === "income");
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const symbol = currencies.find((c) => c.id === "inr")?.symbol ?? "₹";

    exportToPDF(
      transactions,
      { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses },
      symbol,
    );
    setShowExportMenu(false);
  };

  // Show loading state while Firebase initializes
  if (!initialized) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth screen if user is not logged in
  if (!user) {
    return <Auth />;
  }

  return (
    <main className={styles.app}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <h1 className={styles.navTitle}>Finance Tracker</h1>
        </div>
        <div className={styles.navLinks}>
          <button
            className={`${styles.navLink} ${currentView === "dashboard" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`${styles.navLink} ${currentView === "transactions" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("transactions")}
          >
            Transactions
          </button>
          <button
            className={`${styles.navLink} ${currentView === "add" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("add")}
          >
            Add Transaction
          </button>
          <button
            className={`${styles.navLink} ${currentView === "budget" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("budget")}
          >
            Budget
          </button>
          <button
            className={`${styles.navLink} ${currentView === "goals" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("goals")}
          >
            Goals
          </button>
          <button
            className={`${styles.navLink} ${currentView === "insights" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("insights")}
          >
            Insights
          </button>
          <button
            className={`${styles.navLink} ${currentView === "predictions" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("predictions")}
          >
            Predictions
          </button>
          <button
            className={`${styles.navLink} ${currentView === "chatbot" ? styles.navLinkActive : ""}`}
            onClick={() => setCurrentView("chatbot")}
          >
            Assistant
          </button>
        </div>
        <div className={styles.navActions}>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>

          <div className={styles.exportDropdown}>
            <button
              className={styles.exportButton}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button onClick={handleExportCSV}>Export CSV</button>
                <button onClick={handleExportPDF}>Export PDF</button>
              </div>
            )}
          </div>
        </div>
        <div className={styles.navUser}>
          <span className={styles.userEmail}>{user.email}</span>
          <button
            className={styles.logoutButton}
            onClick={() => void handleLogout()}
            disabled={loading}
          >
            {loading ? "..." : "Logout"}
          </button>
        </div>
      </nav>

      <section className={styles.main}>
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "transactions" && <TransactionsTable />}
        {currentView === "add" && (
          <TransactionForm
            onSuccess={() => {
              alert("Transaction added successfully!");
            }}
          />
        )}
        {currentView === "budget" && <Budget />}
        {currentView === "goals" && <Goals />}
        {currentView === "insights" && <Insights />}
        {currentView === "predictions" && <Predictions />}
        {currentView === "chatbot" && <Chatbot />}
      </section>
    </main>
  );
}

export default App;
