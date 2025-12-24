import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexeddbStorage } from "./indexeddbStorage";
import { v4 as uuidv4 } from "uuid";

export type Budget = {
  id: string;
  categoryId: string;
  amount: number; // budget limit
  period: "monthly" | "yearly";
  currencyId: string;
  createdAt: string;
};

type BudgetStore = {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetByCategory: (categoryId: string, currencyId: string) => Budget | undefined;
};

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      budgets: [],

      addBudget: (budget) => {
        const newBudget: Budget = {
          ...budget,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ budgets: [...state.budgets, newBudget] }));
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
      },

      getBudgetByCategory: (categoryId, currencyId) => {
        return get().budgets.find(
          (b) => b.categoryId === categoryId && b.currencyId === currencyId,
        );
      },
    }),
    {
      name: "budget-store",
      storage: createJSONStorage(() => indexeddbStorage),
      version: 1,
    },
  ),
);
