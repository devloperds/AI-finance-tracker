import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Category } from "../types/models";
import { seedCategories } from "../data/seedData";
import { indexeddbStorage } from "./indexeddbStorage";

type CategoriesStore = {
  // state
  categories: Category[];

  // selectors
  getCategoryById: (id: string) => Category | undefined;
  getSubcategories: (parentId: string) => Category[];
  getRootCategories: (type: "income" | "expense") => Category[];
};

export const useCategoriesStore = create<CategoriesStore>()(
  persist(
    (_set, get) => ({
      // initial state (populated from indexeddb or seed)
      categories: [],

      // find single category by id
      getCategoryById: (id) => get().categories.find((c) => c.id === id),

      // get child categories of a parent (for hierarchical dropdowns)
      getSubcategories: (parentId) => get().categories.filter((c) => c.parentId === parentId),

      // get root-level categories (no parent) filtered by type
      getRootCategories: (type) => get().categories.filter((c) => c.type === type && !c.parentId),
    }),
    {
      name: "categories-store", // indexeddb key
      storage: createJSONStorage(() => indexeddbStorage),
      version: 2,
      // seed data on first load if empty
      onRehydrateStorage: () => (state) => {
        if (state?.categories.length === 0) {
          setTimeout(() => {
            useCategoriesStore.setState({ categories: seedCategories });
          }, 0);
        }
      },
      // migrate from older schema versions
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return { categories: seedCategories };
        }
        return persistedState;
      },
    },
  ),
);
