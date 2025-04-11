import {
  GET_PRODUCTS,
  GET_PRODUCTS_ERROR,
  SET_PRODUCTS_LOADING,
  RESET_PRODUCTS,
  GET_PRODUCT_DETAILS,
  GET_PRODUCT_DETAILS_ERROR,
  SET_PRODUCT_DETAILS_LOADING
} from '../Actions/Product.actions';

const initialState = {
  products: [],
  loading: false,
  error: null,
  productsCount: 0,
  filteredProductsCount: 0,
  resPerPage: 8,
  currentPage: 1,
  filters: {},
  productDetails: null,
  productDetailsLoading: false,
  productDetailsError: null
};
  
  export default function productReducer(state = initialState, action) {
    switch (action.type) {
      case GET_PRODUCTS:
        return {
          ...state,
          products: action.payload.products,
          productsCount: action.payload.productsCount,
          filteredProductsCount: action.payload.filteredProductsCount,
          resPerPage: action.payload.resPerPage,
          currentPage: action.payload.currentPage,
          filters: action.payload.filters,
          loading: false,
          error: null
        };
        
      case GET_PRODUCTS_ERROR:
        return {
          ...state,
          error: action.payload,
          loading: false
        };
        
      case SET_PRODUCTS_LOADING:
        return {
          ...state,
          loading: action.payload
        };
        
      case RESET_PRODUCTS:
        return initialState;

      case SET_PRODUCT_DETAILS_LOADING:
        return {
          ...state,
          productDetailsLoading: action.payload
        };
        
      case GET_PRODUCT_DETAILS:
        return {
          ...state,
          productDetails: action.payload,
          productDetailsError: null
        };
        
      case GET_PRODUCT_DETAILS_ERROR:
        return {
          ...state,
          productDetailsError: action.payload
        };
          
        
      default:
        return state;
    }
  }