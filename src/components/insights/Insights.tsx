import { useMemo } from "react";
import { useTransactionsStore } from "../../store/transactionsStore";
import { useCategoriesStore } from "../../store/categoriesStore";
import { useAccountsStore } from "../../store/accountsStore";
import styles from "./Insights.module.css";

type Insight = {
  id: string;
  type: "warning" | "success" | "info" | "tip";
  icon: string;
  title: string;
  description: string;
  value?: string;
};

export default function Insights() {
  const getActualTransactions = useTransactionsStore((s) => s.getActualTransactions);
  const categories = useCategoriesStore((s) => s.categories);
  const currencies = useAccountsStore((s) => s.currencies);

  const insights = useMemo(() => {
    const transactions = getActualTransactions();
    const insights: Insight[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter transactions by current month and last month
    const thisMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    // Calculate totals
    const thisMonthExpenses = thisMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const lastMonthExpenses = lastMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const thisMonthIncome = thisMonthTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const lastMonthIncome = lastMonthTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    // 1. Spending change insight
    if (lastMonthExpenses > 0) {
      const changePercent = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (changePercent > 20) {
        insights.push({
          id: "spending-increase",
          type: "warning",
          icon: "📈",
          title: "Spending Increased",
          description: `Your spending is up ${changePercent.toFixed(0)}% compared to last month. Consider reviewing your expenses.`,
          value: `+${changePercent.toFixed(0)}%`,
        });
      } else if (changePercent < -10) {
        insights.push({
          id: "spending-decrease",
          type: "success",
          icon: "📉",
          title: "Great Job Saving!",
          description: `You've reduced spending by ${Math.abs(changePercent).toFixed(0)}% compared to last month. Keep it up!`,
          value: `${changePercent.toFixed(0)}%`,
        });
      }
    }

    // 2. Savings rate insight
    if (thisMonthIncome > 0) {
      const savingsRate = ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100;
      if (savingsRate >= 20) {
        insights.push({
          id: "savings-rate-good",
          type: "success",
          icon: "💰",
          title: "Excellent Savings Rate",
          description: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Financial experts recommend 20%+.`,
          value: `${savingsRate.toFixed(0)}%`,
        });
      } else if (savingsRate < 10 && savingsRate >= 0) {
        insights.push({
          id: "savings-rate-low",
          type: "warning",
          icon: "⚠️",
          title: "Low Savings Rate",
          description: `You're only saving ${savingsRate.toFixed(0)}% of income. Try to aim for at least 20%.`,
          value: `${savingsRate.toFixed(0)}%`,
        });
      } else if (savingsRate < 0) {
        insights.push({
          id: "overspending",
          type: "warning",
          icon: "🚨",
          title: "Spending More Than Earning",
          description:
            "Your expenses exceed your income this month. Review your budget immediately.",
          value: "Deficit",
        });
      }
    }

    // 3. Top spending category
    const categorySpending = new Map<string, number>();
    thisMonthTxns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categorySpending.set(t.category, (categorySpending.get(t.category) ?? 0) + t.amount);
      });

    if (categorySpending.size > 0) {
      const sorted = [...categorySpending.entries()].sort((a, b) => b[1] - a[1]);
      const topCategory = sorted[0];
      const categoryName = categories.find((c) => c.id === topCategory[0])?.name ?? topCategory[0];
      const percentage = thisMonthExpenses > 0 ? (topCategory[1] / thisMonthExpenses) * 100 : 0;

      insights.push({
        id: "top-category",
        type: "info",
        icon: "🏷️",
        title: `Top Spending: ${categoryName}`,
        description: `${categoryName} accounts for ${percentage.toFixed(0)}% of your spending this month.`,
        value: `₹${topCategory[1].toFixed(0)}`,
      });

      // Check for unusual spending
      const lastMonthCategorySpending = lastMonthTxns
        .filter((t) => t.type === "expense" && t.category === topCategory[0])
        .reduce((s, t) => s + t.amount, 0);

      if (lastMonthCategorySpending > 0 && topCategory[1] > lastMonthCategorySpending * 1.5) {
        insights.push({
          id: "unusual-spending",
          type: "warning",
          icon: "🔍",
          title: `Unusual ${categoryName} Spending`,
          description: `You've spent 50%+ more on ${categoryName} compared to last month.`,
          value: `+${(((topCategory[1] - lastMonthCategorySpending) / lastMonthCategorySpending) * 100).toFixed(0)}%`,
        });
      }
    }

    // 4. Transaction frequency insight
    const avgDailyTxns = thisMonthTxns.length / now.getDate();
    if (avgDailyTxns > 5) {
      insights.push({
        id: "high-frequency",
        type: "tip",
        icon: "💡",
        title: "Many Small Transactions",
        description: `You average ${avgDailyTxns.toFixed(1)} transactions per day. Consider consolidating purchases to save time.`,
      });
    }

    // 5. Weekend spending pattern
    const weekendTxns = thisMonthTxns.filter((t) => {
      const day = new Date(t.date).getDay();
      return day === 0 || day === 6;
    });
    const weekendSpending = weekendTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const weekendPercent = thisMonthExpenses > 0 ? (weekendSpending / thisMonthExpenses) * 100 : 0;

    if (weekendPercent > 40) {
      insights.push({
        id: "weekend-spending",
        type: "info",
        icon: "📅",
        title: "Weekend Spender",
        description: `${weekendPercent.toFixed(0)}% of your spending happens on weekends. Plan your weekend activities wisely!`,
        value: `${weekendPercent.toFixed(0)}%`,
      });
    }

    // 6. Income trend
    if (lastMonthIncome > 0 && thisMonthIncome > lastMonthIncome * 1.1) {
      insights.push({
        id: "income-increase",
        type: "success",
        icon: "🎉",
        title: "Income Increased!",
        description: `Your income is up ${(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(0)}% this month. Great progress!`,
        value: `+${(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(0)}%`,
      });
    }

    // Default insight if no data
    if (insights.length === 0) {
      insights.push({
        id: "no-data",
        type: "info",
        icon: "📊",
        title: "Start Tracking",
        description:
          "Add more transactions to get personalized spending insights and recommendations.",
      });
    }

    return insights;
  }, [getActualTransactions, categories, currencies]);

  const getInsightClass = (type: Insight["type"]) => {
    switch (type) {
      case "warning":
        return styles.warning;
      case "success":
        return styles.success;
      case "tip":
        return styles.tip;
      default:
        return styles.info;
    }
  };

  return (
    <div className={styles.insights}>
      <h3 className={styles.title}>🧠 Smart Insights</h3>
      <div className={styles.insightsList}>
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`${styles.insightCard} ${getInsightClass(insight.type)}`}
          >
            <span className={styles.icon}>{insight.icon}</span>
            <div className={styles.content}>
              <div className={styles.header}>
                <h4 className={styles.insightTitle}>{insight.title}</h4>
                {insight.value && <span className={styles.value}>{insight.value}</span>}
              </div>
              <p className={styles.description}>{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
