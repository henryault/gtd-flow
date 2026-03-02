import { createContext, useContext } from 'react';
import { useItems } from '../hooks/useItems';

const ItemsContext = createContext(null);

export function ItemsProvider({ children }) {
  const itemsState = useItems();
  return (
    <ItemsContext.Provider value={itemsState}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItemsContext() {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItemsContext must be used within an ItemsProvider');
  }
  return context;
}
