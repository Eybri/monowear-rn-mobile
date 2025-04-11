import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Reducers/Auth.reducer';
import productReducer from './Reducers/Product.reducer';
// import cartReducer from './Reducers/Cart.reducer';
import orderReducer from './Reducers/Order.reducer';

const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    // cart: cartReducer,
    order: orderReducer
  },
});

export default store;