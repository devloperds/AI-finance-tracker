import { useState, useRef, useEffect } from "react";
import { useTransactionsStore } from "../../store/transactionsStore";
import { useCategoriesStore } from "../../store/categoriesStore";
import { useAccountsStore } from "../../store/accountsStore";
import styles from "./Chatbot.module.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        '👋 Hi! I\'m your Finance Assistant. Ask me about your spending, income, or financial habits. Try questions like:\n\n• "How much did I spend on food this month?"\n• "What\'s my total income?"\n• "Show my top spending categories"\n• "How much did I spend last week?"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getActualTransactions = useTransactionsStore((s) => s.getActualTransactions);
  const getCategoryById = useCategoriesStore((s) => s.getCategoryById);
  const getRootCategories = useCategoriesStore((s) => s.getRootCategories);
  const currencies = useAccountsStore((s) => s.currencies);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrencySymbol = () => {
    return currencies.find((c) => c.id === "inr")?.symbol ?? "₹";
  };

  const parseQuery = (query: string): string => {
    const transactions = getActualTransactions();
    const lowerQuery = query.toLowerCase();
    const symbol = getCurrencySymbol();

    // Date range helpers
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

    // Filter by date range
    const filterByDateRange = (start: Date, end: Date = new Date()) => {
      return transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    };

    // Get expenses/income
    const getExpenses = (txns: typeof transactions) => txns.filter((t) => t.type === "expense");
    const getIncome = (txns: typeof transactions) => txns.filter((t) => t.type === "income");
    const sum = (txns: typeof transactions) => txns.reduce((s, t) => s + t.amount, 0);

    // Category name matching
    const findCategoryMatch = (q: string) => {
      const allCategories = [...getRootCategories("expense"), ...getRootCategories("income")];
      for (const cat of allCategories) {
        if (q.includes(cat.name.toLowerCase())) {
          return cat;
        }
      }
      // Common aliases
      const aliases: Record<string, string[]> = {
        food: ["food", "groceries", "grocery", "eating", "restaurant", "dining"],
        transport: ["transport", "transportation", "travel", "uber", "gas", "fuel"],
        shopping: ["shopping", "clothes", "clothing", "amazon"],
        entertainment: ["entertainment", "movies", "games", "netflix", "spotify"],
        utilities: ["utilities", "bills", "electricity", "water", "internet"],
        health: ["health", "medical", "doctor", "medicine", "hospital"],
      };
      for (const [catName, words] of Object.entries(aliases)) {
        if (words.some((w) => q.includes(w))) {
          const match = allCategories.find((c) => c.name.toLowerCase().includes(catName));
          if (match) return match;
        }
      }
      return null;
    };

    // Parse time period
    let dateFilteredTxns = transactions;
    let periodDesc = "all time";

    if (lowerQuery.includes("this month") || lowerQuery.includes("current month")) {
      dateFilteredTxns = filterByDateRange(startOfMonth);
      periodDesc = "this month";
    } else if (lowerQuery.includes("last month") || lowerQuery.includes("previous month")) {
      dateFilteredTxns = filterByDateRange(startOfLastMonth, endOfLastMonth);
      periodDesc = "last month";
    } else if (lowerQuery.includes("this week")) {
      dateFilteredTxns = filterByDateRange(startOfWeek);
      periodDesc = "this week";
    } else if (lowerQuery.includes("last week") || lowerQuery.includes("previous week")) {
      dateFilteredTxns = filterByDateRange(startOfLastWeek, endOfLastWeek);
      periodDesc = "last week";
    } else if (lowerQuery.includes("today")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilteredTxns = filterByDateRange(today);
      periodDesc = "today";
    } else if (lowerQuery.includes("yesterday")) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      dateFilteredTxns = filterByDateRange(yesterday, endOfYesterday);
      periodDesc = "yesterday";
    }

    // Handle different query types
    // Total spending
    if (
      lowerQuery.includes("total spend") ||
      lowerQuery.includes("how much did i spend") ||
      lowerQuery.includes("total expense")
    ) {
      const category = findCategoryMatch(lowerQuery);
      if (category) {
        const categoryTxns = getExpenses(dateFilteredTxns).filter((t) => {
          const cat = getCategoryById(t.category);
          return cat?.id === category.id || cat?.parentId === category.id;
        });
        const total = sum(categoryTxns);
        return `💸 You spent **${symbol}${total.toFixed(2)}** on **${category.name}** ${periodDesc}.\n\nThis includes ${categoryTxns.length} transaction${categoryTxns.length !== 1 ? "s" : ""}.`;
      }
      const total = sum(getExpenses(dateFilteredTxns));
      return `💸 Your total spending ${periodDesc} is **${symbol}${total.toFixed(2)}** across ${getExpenses(dateFilteredTxns).length} transactions.`;
    }

    // Total income
    if (
      lowerQuery.includes("income") ||
      lowerQuery.includes("earn") ||
      lowerQuery.includes("salary")
    ) {
      const total = sum(getIncome(dateFilteredTxns));
      return `💰 Your total income ${periodDesc} is **${symbol}${total.toFixed(2)}** from ${getIncome(dateFilteredTxns).length} transaction${getIncome(dateFilteredTxns).length !== 1 ? "s" : ""}.`;
    }

    // Savings
    if (
      lowerQuery.includes("saving") ||
      lowerQuery.includes("saved") ||
      lowerQuery.includes("save")
    ) {
      const income = sum(getIncome(dateFilteredTxns));
      const expenses = sum(getExpenses(dateFilteredTxns));
      const savings = income - expenses;
      const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
      if (savings > 0) {
        return `🎉 Great job! You saved **${symbol}${savings.toFixed(2)}** ${periodDesc}. That's a ${savingsRate}% savings rate!`;
      } else {
        return `⚠️ You spent **${symbol}${Math.abs(savings).toFixed(2)}** more than you earned ${periodDesc}. Consider reviewing your expenses.`;
      }
    }

    // Top categories
    if (
      lowerQuery.includes("top") ||
      lowerQuery.includes("highest") ||
      lowerQuery.includes("most")
    ) {
      const expenses = getExpenses(dateFilteredTxns);
      const categoryTotals: Record<string, { name: string; total: number }> = {};

      for (const t of expenses) {
        const cat = getCategoryById(t.category);
        const parentCat = cat?.parentId ? getCategoryById(cat.parentId) : cat;
        const catName = parentCat?.name ?? "Unknown";
        const catId = parentCat?.id ?? "unknown";

        if (!categoryTotals[catId]) {
          categoryTotals[catId] = { name: catName, total: 0 };
        }
        categoryTotals[catId].total += t.amount;
      }

      const sorted = Object.values(categoryTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      if (sorted.length === 0) {
        return "🤔 No expenses found for the selected period.";
      }

      let response = `📊 Your top spending categories ${periodDesc}:\n\n`;
      sorted.forEach((cat, i) => {
        const emoji = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
        response += `${emoji} **${cat.name}**: ${symbol}${cat.total.toFixed(2)}\n`;
      });
      return response;
    }

    // Balance/Net
    if (lowerQuery.includes("balance") || lowerQuery.includes("net")) {
      const income = sum(getIncome(dateFilteredTxns));
      const expenses = sum(getExpenses(dateFilteredTxns));
      const balance = income - expenses;
      return `📊 Your financial summary ${periodDesc}:\n\n💰 Income: ${symbol}${income.toFixed(2)}\n💸 Expenses: ${symbol}${expenses.toFixed(2)}\n${balance >= 0 ? "✅" : "⚠️"} Net: ${symbol}${balance.toFixed(2)}`;
    }

    // Category spending (generic)
    const category = findCategoryMatch(lowerQuery);
    if (category) {
      const categoryTxns = getExpenses(dateFilteredTxns).filter((t) => {
        const cat = getCategoryById(t.category);
        return cat?.id === category.id || cat?.parentId === category.id;
      });
      const total = sum(categoryTxns);
      return `💸 Your **${category.name}** spending ${periodDesc}: **${symbol}${total.toFixed(2)}** (${categoryTxns.length} transaction${categoryTxns.length !== 1 ? "s" : ""})`;
    }

    // Transaction count
    if (
      lowerQuery.includes("how many") ||
      lowerQuery.includes("count") ||
      lowerQuery.includes("number of")
    ) {
      if (lowerQuery.includes("expense")) {
        return `📝 You have ${getExpenses(dateFilteredTxns).length} expense transactions ${periodDesc}.`;
      }
      if (lowerQuery.includes("income")) {
        return `📝 You have ${getIncome(dateFilteredTxns).length} income transactions ${periodDesc}.`;
      }
      return `📝 You have ${dateFilteredTxns.length} total transactions ${periodDesc} (${getExpenses(dateFilteredTxns).length} expenses, ${getIncome(dateFilteredTxns).length} income).`;
    }

    // Average spending
    if (lowerQuery.includes("average") || lowerQuery.includes("avg")) {
      const expenses = getExpenses(dateFilteredTxns);
      if (expenses.length === 0) {
        return "🤔 No expenses found to calculate average.";
      }
      const avg = sum(expenses) / expenses.length;
      return `📊 Your average expense ${periodDesc} is **${symbol}${avg.toFixed(2)}** per transaction.`;
    }

    // Help
    if (lowerQuery.includes("help") || lowerQuery.includes("what can you do")) {
      return '🤖 I can help you with:\n\n• **Spending**: "How much did I spend this month?"\n• **Income**: "What\'s my total income?"\n• **Categories**: "How much on food this week?"\n• **Top spending**: "Show my top categories"\n• **Savings**: "How much did I save?"\n• **Balance**: "What\'s my net balance?"\n• **Comparisons**: Add "this month", "last week", etc.';
    }

    return '🤔 I\'m not sure how to answer that. Try asking about your spending, income, savings, or specific categories. Type "help" for examples!';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsTyping(true);

    // Simulate typing delay for natural feel
    setTimeout(
      () => {
        const response = parseQuery(currentInput);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      },
      500 + Math.random() * 500,
    );
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => (
      <p
        key={i}
        dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
        }}
      />
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🤖 Finance Assistant</h2>
        <p className={styles.subtitle}>Ask questions about your finances</p>
      </div>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.assistantMessage}`}
          >
            <div className={styles.messageContent}>{formatMessageContent(message.content)}</div>
            <span className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <div className={styles.typing}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendButton} disabled={input.trim() === ""}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
