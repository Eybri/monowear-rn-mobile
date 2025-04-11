// Redux/Reducers/Cart.reducer.js
const initialState = {
  items: [],
  subtotal: 0,
  cartCount: 0,
  loading: false,
  error: null
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'CART_LOADING':
      return { ...state, loading: true };
    case 'CART_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_CART_ITEMS':
      return {
        ...state,
        items: action.payload.items,
        subtotal: action.payload.subtotal,
        cartCount: action.payload.cartCount,
        loading: false,
        error: null
      };
    case 'UPDATE_CART_ITEM':
      // Find and update the specific item
      const updatedItems = state.items.map(item => 
        item._id === action.payload.itemId ? action.payload.updatedItem : item
      );
      return {
        ...state,
        items: updatedItems,
        subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        loading: false,
        error: null
      };
    case 'REMOVE_CART_ITEM':
      // Filter out the removed item
      const filteredItems = state.items.filter(item => item._id !== action.payload.itemId);
      return {
        ...state,
        items: filteredItems,
        subtotal: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        cartCount: filteredItems.length,
        loading: false,
        error: null
      };
    case 'CLEAR_CART':
      return initialState;
    default:
      return state;
  }
};