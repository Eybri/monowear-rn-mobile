import {
    ORDER_LOADING,
    ORDER_ERROR,
    CREATE_ORDER_SUCCESS,
    GET_USER_ORDERS_SUCCESS,
    GET_ALL_ORDERS_SUCCESS,
    UPDATE_ORDER_SUCCESS,
    DELETE_ORDER_SUCCESS,
    GET_SALES_STATS_SUCCESS
  } from '../Actions/Order.actions';
  
  const initialState = {
    loading: false,
    error: null,
    userOrders: [],
    allOrders: [],
    salesStats: null,
    lastCreatedOrder: null
  };
  
  export default function orderReducer(state = initialState, action) {
    switch (action.type) {
      case ORDER_LOADING:
        return {
          ...state,
          loading: true,
          error: null
        };
        
      case ORDER_ERROR:
        return {
          ...state,
          loading: false,
          error: action.payload
        };
        
      case CREATE_ORDER_SUCCESS:
        return {
          ...state,
          loading: false,
          error: null,
          userOrders: [...state.userOrders, action.payload],
          lastCreatedOrder: action.payload
        };
        
      case GET_USER_ORDERS_SUCCESS:
        return {
          ...state,
          loading: false,
          error: null,
          userOrders: action.payload
        };
        
      case GET_ALL_ORDERS_SUCCESS:
        return {
          ...state,
          loading: false,
          error: null,
          allOrders: action.payload
        };
        
      case UPDATE_ORDER_SUCCESS:
        return {
          ...state,
          loading: false,
          error: null,
          userOrders: state.userOrders.map(order => 
            order._id === action.payload._id ? action.payload : order
          ),
          allOrders: state.allOrders.map(order => 
            order._id === action.payload._id ? action.payload : order
          )
        };
        
      case DELETE_ORDER_SUCCESS:
        return {
          ...state,
          loading: false,
          error: null,
          userOrders: state.userOrders.filter(order => order._id !== action.payload),
          allOrders: state.allOrders.filter(order => order._id !== action.payload)
        };
        
      case GET_SALES_STATS_SUCCESS:
        return {
          ...state,
          loading: false,
          error: null,
          salesStats: action.payload
        };
        
      default:
        return state;
    }
  }