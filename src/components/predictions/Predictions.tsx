import { useMemo } from "react";
import { useTransactionsStore } from "../../store/transactionsStore";
import { useAccountsStore } from "../../store/accountsStore";
import styles from "./Predictions.module.css";

type PredictionData = {
  month: string;
  predictedExpenses: number;
  predictedIncome: number;
  confidence: number;
};

const calculateTrend = (values: number[]): number => {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  return denominator === 0 ? 0 : numerator / denominator;
};

const Predictions = () => {
  const getActualTransactions = useTransactionsStore((s) => s.getActualTransactions);
  const currencies = useAccountsStore((s) => s.currencies);

  const symbol = useMemo(() => {
    return currencies.find((c) => c.id === "inr")?.symbol ?? "₹";
  }, [currencies]);

  // Generate predictions using useMemo instead of useEffect
  const predictions = useMemo(() => {
    const transactions = getActualTransactions();

    // Group transactions by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((t) => {
      const key = t.date.substring(0, 7); // YYYY-MM
      if (monthlyData[key] === undefined) {
        monthlyData[key] = { income: 0, expenses: 0 };
      }
      if (t.type === "income") {
        monthlyData[key].income += t.amount;
      } else {
        monthlyData[key].expenses += t.amount;
      }
    });

    // Sort months and get last 6 months of data
    const sortedMonths = Object.keys(monthlyData).sort();
    const recentMonths = sortedMonths.slice(-6);

    if (recentMonths.length < 2) {
      return [];
    }

    // Calculate averages and trends
    const incomeValues = recentMonths.map((m) => monthlyData[m].income);
    const expenseValues = recentMonths.map((m) => monthlyData[m].expenses);

    const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
    const avgExpenses = expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length;

    // Calculate trend (simple linear regression slope)
    const incomeTrend = calculateTrend(incomeValues);
    const expenseTrend = calculateTrend(expenseValues);

    // Generate next 3 months predictions
    const now = new Date();
    const futureMonths: PredictionData[] = [];

    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = futureDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      // Apply trend to average
      const predictedIncome = Math.max(0, avgIncome + incomeTrend * i);
      const predictedExpenses = Math.max(0, avgExpenses + expenseTrend * i);

      // Calculate confidence (decreases with distance)
      const confidence = Math.max(50, 95 - i * 10);

      futureMonths.push({
        month: monthName,
        predictedIncome,
        predictedExpenses,
        confidence,
      });
    }

    return futureMonths;
  }, [getActualTransactions]);

  // Calculate spending by category for next month projection
  const categoryProjections = useMemo(() => {
    const transactions = getActualTransactions();
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(lastMonthKey))
      .forEach((t) => {
        const catId = t.category !== "" ? t.category : "Other";
        categoryTotals[catId] = (categoryTotals[catId] ?? 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [getActualTransactions]);

  if (predictions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>📈 Spending Predictions</h2>
        </div>
        <div className={styles.empty}>
          <p>
            Not enough data to generate predictions. Add more transactions over multiple months.
          </p>
        </div>
      </div>
    );
  }

  const nextMonth = predictions[0];
  const projectedSavings = nextMonth.predictedIncome - nextMonth.predictedExpenses;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📈 Spending Predictions</h2>
        <p className={styles.subtitle}>AI-powered forecasts based on your spending patterns</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Next Month Expenses</span>
          <span className={styles.summaryValue}>
            {symbol}
            {nextMonth.predictedExpenses.toFixed(0)}
          </span>
          <span className={styles.confidence}>{nextMonth.confidence}% confidence</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Next Month Income</span>
          <span className={styles.summaryValue}>
            {symbol}
            {nextMonth.predictedIncome.toFixed(0)}
          </span>
          <span className={styles.confidence}>{nextMonth.confidence}% confidence</span>
        </div>
        <div
          className={`${styles.summaryCard} ${projectedSavings >= 0 ? styles.positive : styles.negative}`}
        >
          <span className={styles.summaryLabel}>Projected Savings</span>
          <span className={styles.summaryValue}>
            {symbol}
            {projectedSavings.toFixed(0)}
          </span>
          <span className={styles.trend}>
            {projectedSavings >= 0 ? "📈 On track" : "📉 Deficit expected"}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>3-Month Forecast</h3>
          <div className={styles.forecastList}>
            {predictions.map((pred, idx) => (
              <div key={idx} className={styles.forecastItem}>
                <div className={styles.forecastMonth}>
                  <span className={styles.monthName}>{pred.month}</span>
                  <span className={styles.confidenceBadge}>{pred.confidence}%</span>
                </div>
                <div className={styles.forecastBars}>
                  <div className={styles.forecastBar}>
                    <span className={styles.barLabel}>Income</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.barFillIncome}
                        style={{
                          width: `${Math.min(100, (pred.predictedIncome / Math.max(...predictions.map((p) => p.predictedIncome))) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className={styles.barValue}>
                      {symbol}
                      {pred.predictedIncome.toFixed(0)}
                    </span>
                  </div>
                  <div className={styles.forecastBar}>
                    <span className={styles.barLabel}>Expenses</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.barFillExpense}
                        style={{
                          width: `${Math.min(100, (pred.predictedExpenses / Math.max(...predictions.map((p) => p.predictedExpenses))) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className={styles.barValue}>
                      {symbol}
                      {pred.predictedExpenses.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Expected Top Expenses</h3>
          <p className={styles.cardSubtitle}>Based on last month's spending</p>
          {categoryProjections.length > 0 ? (
            <div className={styles.categoryList}>
              {categoryProjections.map((cat, idx) => (
                <div key={idx} className={styles.categoryItem}>
                  <span className={styles.categoryRank}>#{idx + 1}</span>
                  <span className={styles.categoryName}>{cat.category}</span>
                  <span className={styles.categoryAmount}>
                    {symbol}
                    {cat.amount.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No category data available</p>
          )}
        </div>
      </div>

      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>💡 Smart Tips</h3>
        <div className={styles.tipsList}>
          {projectedSavings < 0 && (
            <div className={styles.tip}>
              <span className={styles.tipIcon}>⚠️</span>
              <p>
                You're projected to spend more than you earn. Consider reducing discretionary
                spending.
              </p>
            </div>
          )}
          {nextMonth.predictedExpenses > nextMonth.predictedIncome * 0.8 &&
            projectedSavings >= 0 && (
              <div className={styles.tip}>
                <span className={styles.tipIcon}>💰</span>
                <p>
                  Your expenses are high relative to income. Aim to save at least 20% of your
                  income.
                </p>
              </div>
            )}
          {projectedSavings >= nextMonth.predictedIncome * 0.2 && (
            <div className={styles.tip}>
              <span className={styles.tipIcon}>🎉</span>
              <p>Great job! You're on track to save 20%+ of your income next month.</p>
            </div>
          )}
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📊</span>
            <p>Predictions improve with more transaction data. Keep tracking your expenses!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
