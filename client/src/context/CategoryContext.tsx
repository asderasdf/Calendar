import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

// Category type
export interface Category {
  id: string;
  name: string;
  color: string;
  default?: boolean;
}

// Context type
type CategoryContextType = {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
};

// Create context
export const CategoryContext = createContext<CategoryContextType>({
  categories: [],
  addCategory: async () => {},
  updateCategory: async () => {},
  deleteCategory: async () => {},
  getCategory: () => undefined,
});

// Provider component
export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories from the server on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('فشل في تحميل الأقسام:', error);
      }
    };

    fetchCategories();
  }, []);

  // Add a new category
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      const newCategory = await res.json();
      setCategories((prev) => [...prev, newCategory]);
    } catch (error) {
      console.error('فشل في إضافة القسم:', error);
    }
  };

  // Update an existing category
  const updateCategory = async (
    id: string,
    updatedCategory: Omit<Category, 'id'>
  ) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory),
      });
      const newCategory = await res.json();
      setCategories((prev) =>
        prev.map((category) => (category.id === id ? newCategory : category))
      );
    } catch (error) {
      console.error('فشل في تحديث القسم:', error);
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (error) {
      console.error('فشل في حذف القسم:', error);
    }
  };

  // Get a single category by ID
  const getCategory = (id: string) => {
    return categories.find((category) => category.id === id);
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

// Custom hook to use the category context
export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
