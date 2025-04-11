import { Toast } from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";

export const GET_PRODUCTS = "GET_PRODUCTS";
export const GET_PRODUCTS_ERROR = "GET_PRODUCTS_ERROR";
export const SET_PRODUCTS_LOADING = "SET_PRODUCTS_LOADING";
export const RESET_PRODUCTS = "RESET_PRODUCTS";
export const GET_PRODUCT_DETAILS = "GET_PRODUCT_DETAILS";
export const GET_PRODUCT_DETAILS_ERROR = "GET_PRODUCT_DETAILS_ERROR";
export const SET_PRODUCT_DETAILS_LOADING = "SET_PRODUCT_DETAILS_LOADING";

export const getProducts = (page = 1, filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: SET_PRODUCTS_LOADING, payload: true });

    // Construct query parameters properly
    const params = new URLSearchParams();
    params.append('page', page);

    // Handle category filter
    if (filters.category) {
      params.append('category', filters.category);
    }

    // Handle price range filter
    if (filters.price) {
      if (filters.price.gte) {
        params.append('price[gte]', filters.price.gte);
      }
      if (filters.price.lte) {
        params.append('price[lte]', filters.price.lte);
      }
    }

    const response = await fetch(`${baseURL}/products?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    
    dispatch({
      type: GET_PRODUCTS,
      payload: {
        products: data.products,
        productsCount: data.productsCount,
        filteredProductsCount: data.filteredProductsCount,
        resPerPage: data.resPerPage,
        currentPage: page,
        filters // Store the applied filters in redux
      }
    });

    return data;
  } catch (err) {
    console.error("Products fetch error:", err);
    
    Toast.show({
      type: "error",
      text1: "Products Error",
      text2: err.message || "Failed to load products",
      position: "bottom"
    });
    
    dispatch({
      type: GET_PRODUCTS_ERROR,
      payload: err.message || "Failed to load products"
    });
    
    return null;
  } finally {
    dispatch({ type: SET_PRODUCTS_LOADING, payload: false });
  }
};
export const resetProducts = () => ({
  type: RESET_PRODUCTS
});

export const getProductDetails = (productId) => async (dispatch) => {
  try {
    dispatch({ type: SET_PRODUCT_DETAILS_LOADING, payload: true });

    const response = await fetch(`${baseURL}/product/${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch product details");
    }

    const data = await response.json();
    
    dispatch({
      type: GET_PRODUCT_DETAILS,
      payload: data.product
    });

    return data;
  } catch (err) {
    console.error("Product details fetch error:", err);
    
    Toast.show({
      type: "error",
      text1: "Product Error",
      text2: err.message || "Failed to load product details",
      position: "bottom"
    });
    
    dispatch({
      type: GET_PRODUCT_DETAILS_ERROR,
      payload: err.message || "Failed to load product details"
    });
    
    return null;
  } finally {
    dispatch({ type: SET_PRODUCT_DETAILS_LOADING, payload: false });
  }
};