import baseURL from '../../assets/common/baseurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const getCartItems = (token) => async (dispatch) => {
  dispatch({ type: 'CART_LOADING' });
  try {
    const response = await fetch(`${baseURL}/cart/items`, {
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`      }
    });
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to fetch cart items');
    
    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    dispatch({
      type: 'SET_CART_ITEMS',
      payload: {
        items: data.items,
        subtotal,
        cartCount: data.items.length
      }
    });
  } catch (error) {
    dispatch({ type: 'CART_ERROR', payload: error.message });
  }
};

export const updateCartItem = (itemId, action, token) => async (dispatch, getState) => {
  dispatch({ type: 'CART_LOADING' });
  try {
    const response = await fetch(`${baseURL}/cart/update`, {
      method: 'PUT',
      headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`
      },
      body: JSON.stringify({ itemId, action })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update cart item');
    }
    
    const { items } = getState().cart;
    const itemIndex = items.findIndex(item => item._id === itemId);
    
    if (itemIndex === -1) throw new Error('Item not found in cart');
    
    let updatedItems = [...items];
    let updatedItem = { ...items[itemIndex] };
    
    if (action === 'increase') {
      updatedItem.quantity += 1;
    } else if (action === 'decrease') {
      updatedItem.quantity -= 1;
    }
    
    updatedItems[itemIndex] = updatedItem;
    
    const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    dispatch({
      type: 'UPDATE_CART_ITEM',
      payload: {
        itemId,
        updatedItem,
        newSubtotal
      }
    });
  } catch (error) {
    dispatch({ type: 'CART_ERROR', payload: error.message });
  }
};

export const removeCartItem = (itemId, token) => async (dispatch, getState) => {
  dispatch({ type: 'CART_LOADING' });
  try {
    const response = await fetch(`${baseURL}/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('jwt')}`
      },
      body: JSON.stringify({ itemId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item from cart');
    }
    
    const { items } = getState().cart;
    const newItems = items.filter(item => item._id !== itemId);
    const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    dispatch({
      type: 'REMOVE_CART_ITEM',
      payload: {
        itemId,
        newSubtotal
      }
    });
  } catch (error) {
    dispatch({ type: 'CART_ERROR', payload: error.message });
  }
};

export const clearCart = () => ({ type: 'CLEAR_CART' });