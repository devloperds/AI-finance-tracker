import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexeddbStorage } from "./indexeddbStorage";
import { v4 as uuidv4 } from "uuid";
import type { Goal } from "../types/models";

type GoalsStore = {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addToGoal: (id: string, amount: number) => void;
  getGoalProgress: (id: string) => number;
};

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: uuidv4(),
          currentAmount: goal.currentAmount ?? 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      },

      addToGoal: (id, amount) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: (g.currentAmount ?? 0) + amount } : g,
          ),
        }));
      },

      getGoalProgress: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal || goal.targetAmount === 0) return 0;
        return Math.min(((goal.currentAmount ?? 0) / goal.targetAmount) * 100, 100);
      },
    }),
    {
      name: "goals-store",
      storage: createJSONStorage(() => indexeddbStorage),
      version: 1,
    },
  ),
);
