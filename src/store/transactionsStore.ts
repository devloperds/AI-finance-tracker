import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Transaction, ProjectedTransaction, AnyTransaction } from "../types/models";
import { seedTransactions, seedProjectedTransactions } from "../data/seedData";
import { indexeddbStorage } from "./indexeddbStorage";
import { v4 as uuidv4 } from "uuid";

// Filter criteria for transactions list
export type TransactionFilter = {
  startDate?: string; // transactions on or after this date
  endDate?: string; // transactions on or before this date
  category?: string; // filter by category id
  type?: "income" | "expense"; // filter by transaction type
  accountId?: string; // filter by account id
};

type TransactionsStore = {
  // state
  transactions: AnyTransaction[];
  filters: TransactionFilter;

  // actions
  addTransaction: (transaction: Omit<AnyTransaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<AnyTransaction>) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (filters: TransactionFilter) => void;
  clearFilters: () => void;

  // selectors
  getFilteredTransactions: () => AnyTransaction[];
  getActualTransactions: () => Transaction[];
  getProjectedTransactions: () => ProjectedTransaction[];
};

export const useTransactionsStore = create<TransactionsStore>()(
  persist(
    (set, get) => ({
      // initial state
      transactions: [],
      filters: {},

      // add transaction with auto-generated uuid
      addTransaction: (transaction) => {
        const newTransaction: AnyTransaction = { ...transaction, id: uuidv4() };
        set((state) => ({ transactions: [...state.transactions, newTransaction] }));
      },

      // update transaction by id
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      // delete transaction by id
      deleteTransaction: (id) => {
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
      },

      // replace current filters
      setFilters: (filters) => set({ filters }),

      // reset all filters
      clearFilters: () => set({ filters: {} }),

      // apply current filters and return matching transactions
      getFilteredTransactions: () => {
        const { transactions, filters } = get();
        return transactions.filter((t) => {
          // date range filters
          if (filters.startDate && filters.startDate !== "" && t.date < filters.startDate)
            return false;
          if (filters.endDate && filters.endDate !== "" && t.date > filters.endDate) return false;
          // category filter
          if (filters.category && filters.category !== "" && t.category !== filters.category)
            return false;
          // type filter
          if (filters.type !== undefined && t.type !== filters.type) return false;
          // account filter
          if (filters.accountId && filters.accountId !== "" && t.accountId !== filters.accountId)
            return false;
          return true;
        });
      },

      // return only actual (non-projected) transactions
      getActualTransactions: () => get().transactions.filter((t) => t.isProjected === false),
      // return only projected (planned) transactions
      getProjectedTransactions: () => get().transactions.filter((t) => t.isProjected === true),
    }),
    {
      name: "transactions-store", // indexeddb key
      storage: createJSONStorage(() => indexeddbStorage),
      version: 2,
      // seed data on first load
      onRehydrateStorage: () => (state) => {
        if (state?.transactions.length === 0) {
          setTimeout(() => {
            useTransactionsStore.setState({
              transactions: [...seedTransactions, ...seedProjectedTransactions],
            });
          }, 0);
        }
      },
      // migrate from older schema versions
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return {
            transactions: [...seedTransactions, ...seedProjectedTransactions],
            filters: {},
          };
        }
        return persistedState;
      },
    },
  ),
);
