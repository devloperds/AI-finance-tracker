import { useState } from "react";
import { useBudgetStore } from "../../store/budgetStore";
import { useCategoriesStore } from "../../store/categoriesStore";
import { useAccountsStore } from "../../store/accountsStore";
import { useTransactionsStore } from "../../store/transactionsStore";
import styles from "./Budget.module.css";

export default function Budget() {
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgetStore();
  const categories = useCategoriesStore((s) => s.categories);
  const currencies = useAccountsStore((s) => s.currencies);
  const getActualTransactions = useTransactionsStore((s) => s.getActualTransactions);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    period: "monthly" as "monthly" | "yearly",
    currencyId: "inr",
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount) return;

    if (editingId) {
      updateBudget(editingId, {
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        period: formData.period,
        currencyId: formData.currencyId,
      });
      setEditingId(null);
    } else {
      addBudget({
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        period: formData.period,
        currencyId: formData.currencyId,
      });
    }

    setFormData({ categoryId: "", amount: "", period: "monthly", currencyId: "inr" });
    setShowForm(false);
  };

  const handleEdit = (budget: (typeof budgets)[0]) => {
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount.toString(),
      period: budget.period,
      currencyId: budget.currencyId,
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const getSpentAmount = (categoryId: string, currencyId: string, period: "monthly" | "yearly") => {
    const transactions = getActualTransactions();
    const now = new Date();
    const startDate =
      period === "monthly"
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);

    return transactions
      .filter(
        (t) =>
          t.category === categoryId &&
          t.currencyId === currencyId &&
          t.type === "expense" &&
          new Date(t.date) >= startDate,
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const getCurrencySymbol = (id: string) => currencies.find((c) => c.id === id)?.symbol ?? "₹";

  return (
    <div className={styles.budget}>
      <div className={styles.header}>
        <h2 className={styles.title}>💳 Budget Limits</h2>
        <button className={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Budget"}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className={styles.select}
              required
            >
              <option value="">Select Category</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Budget Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={styles.input}
              min="0"
              step="0.01"
              required
            />

            <select
              value={formData.period}
              onChange={(e) =>
                setFormData({ ...formData, period: e.target.value as "monthly" | "yearly" })
              }
              className={styles.select}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            <select
              value={formData.currencyId}
              onChange={(e) => setFormData({ ...formData, currencyId: e.target.value })}
              className={styles.select}
            >
              {currencies.map((cur) => (
                <option key={cur.id} value={cur.id}>
                  {cur.code}
                </option>
              ))}
            </select>

            <button type="submit" className={styles.submitButton}>
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.budgetList}>
        {budgets.length === 0 ? (
          <p className={styles.empty}>No budgets set. Add one to track your spending limits!</p>
        ) : (
          budgets.map((budget) => {
            const spent = getSpentAmount(budget.categoryId, budget.currencyId, budget.period);
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const isOverBudget = spent > budget.amount;
            const symbol = getCurrencySymbol(budget.currencyId);

            return (
              <div key={budget.id} className={styles.budgetCard}>
                <div className={styles.budgetHeader}>
                  <span className={styles.categoryName}>{getCategoryName(budget.categoryId)}</span>
                  <span className={styles.period}>{budget.period}</span>
                </div>

                <div className={styles.amounts}>
                  <span className={isOverBudget ? styles.overBudget : ""}>
                    {symbol}
                    {spent.toFixed(2)}
                  </span>
                  <span className={styles.separator}>/</span>
                  <span>
                    {symbol}
                    {budget.amount.toFixed(2)}
                  </span>
                </div>

                <div className={styles.progressContainer}>
                  <div
                    className={`${styles.progressBar} ${isOverBudget ? styles.progressOverBudget : ""}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {isOverBudget && (
                  <p className={styles.warningText}>
                    ⚠️ Over budget by {symbol}
                    {(spent - budget.amount).toFixed(2)}
                  </p>
                )}

                <div className={styles.actions}>
                  <button className={styles.editButton} onClick={() => handleEdit(budget)}>
                    Edit
                  </button>
                  <button className={styles.deleteButton} onClick={() => deleteBudget(budget.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
