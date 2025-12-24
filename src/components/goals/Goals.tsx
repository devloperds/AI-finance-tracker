import { useState } from "react";
import { useGoalsStore } from "../../store/goalsStore";
import { useAccountsStore } from "../../store/accountsStore";
import styles from "./Goals.module.css";

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, addToGoal, getGoalProgress } = useGoalsStore();
  const currencies = useAccountsStore((s) => s.currencies);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    currencyId: "inr",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    const goalData = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: formData.currentAmount ? parseFloat(formData.currentAmount) : 0,
      targetDate: formData.targetDate || undefined,
    };

    if (editingId) {
      updateGoal(editingId, goalData);
      setEditingId(null);
    } else {
      addGoal(goalData);
    }

    setFormData({
      name: "",
      targetAmount: "",
      currentAmount: "",
      targetDate: "",
      currencyId: "inr",
    });
    setShowForm(false);
  };

  const handleEdit = (goal: (typeof goals)[0]) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: (goal.currentAmount ?? 0).toString(),
      targetDate: goal.targetDate ?? "",
      currencyId: "inr",
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleAddToGoal = (goalId: string) => {
    const amount = parseFloat(addAmount[goalId] ?? "0");
    if (amount > 0) {
      addToGoal(goalId, amount);
      setAddAmount({ ...addAmount, [goalId]: "" });
    }
  };

  const getCurrencySymbol = (id: string) => currencies.find((c) => c.id === id)?.symbol ?? "₹";
  const symbol = getCurrencySymbol("inr");

  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={styles.goals}>
      <div className={styles.header}>
        <h2 className={styles.title}>🎯 Savings Goals</h2>
        <button className={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Goal"}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Goal Name</label>
              <input
                type="text"
                placeholder="e.g., Vacation Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Target Amount</label>
              <input
                type="number"
                placeholder="50000"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className={styles.input}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Current Savings (Optional)</label>
              <input
                type="number"
                placeholder="0"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                className={styles.input}
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Target Date (Optional)</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            {editingId ? "Update Goal" : "Create Goal"}
          </button>
        </form>
      )}

      <div className={styles.goalsList}>
        {goals.length === 0 ? (
          <div className={styles.empty}>
            <p>🎯 No goals yet!</p>
            <p>Start saving by creating your first financial goal.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getGoalProgress(goal.id);
            const remaining = goal.targetAmount - (goal.currentAmount ?? 0);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className={`${styles.goalCard} ${isCompleted ? styles.completed : ""}`}
              >
                <div className={styles.goalHeader}>
                  <h3 className={styles.goalName}>
                    {isCompleted ? "🎉 " : ""}
                    {goal.name}
                  </h3>
                  {daysRemaining !== null && (
                    <span
                      className={`${styles.daysRemaining} ${daysRemaining < 0 ? styles.overdue : ""}`}
                    >
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : `${daysRemaining} days left`}
                    </span>
                  )}
                </div>

                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span className={styles.current}>
                      {symbol}
                      {(goal.currentAmount ?? 0).toFixed(2)}
                    </span>
                    <span className={styles.target}>
                      of {symbol}
                      {goal.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                  </div>
                  <div className={styles.progressPercent}>{progress.toFixed(1)}%</div>
                </div>

                {!isCompleted && (
                  <div className={styles.remaining}>
                    <span>
                      {symbol}
                      {remaining.toFixed(2)} remaining to reach your goal
                    </span>
                  </div>
                )}

                {!isCompleted && (
                  <div className={styles.addSection}>
                    <input
                      type="number"
                      placeholder="Add amount"
                      value={addAmount[goal.id] ?? ""}
                      onChange={(e) => setAddAmount({ ...addAmount, [goal.id]: e.target.value })}
                      className={styles.addInput}
                      min="0"
                      step="0.01"
                    />
                    <button
                      className={styles.addAmountButton}
                      onClick={() => handleAddToGoal(goal.id)}
                    >
                      + Add
                    </button>
                  </div>
                )}

                <div className={styles.actions}>
                  <button className={styles.editButton} onClick={() => handleEdit(goal)}>
                    Edit
                  </button>
                  <button className={styles.deleteButton} onClick={() => deleteGoal(goal.id)}>
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
