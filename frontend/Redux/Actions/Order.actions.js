import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";

export const ORDER_LOADING = "ORDER_LOADING";
export const ORDER_ERROR = "ORDER_ERROR";
export const CREATE_ORDER_SUCCESS = "CREATE_ORDER_SUCCESS";
export const GET_USER_ORDERS_SUCCESS = "GET_USER_ORDERS_SUCCESS";
export const GET_ALL_ORDERS_SUCCESS = "GET_ALL_ORDERS_SUCCESS";
export const UPDATE_ORDER_SUCCESS = "UPDATE_ORDER_SUCCESS";
export const DELETE_ORDER_SUCCESS = "DELETE_ORDER_SUCCESS";
export const GET_SALES_STATS_SUCCESS = "GET_SALES_STATS_SUCCESS";

export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LOADING });
    
    const token = await AsyncStorage.getItem("jwt");
    const response = await fetch(`${baseURL}/orders/create`, {
      method: "POST",
      body: JSON.stringify(orderData),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to create order");
    }

    const data = await response.json();
    
    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: data.order
    });

    Toast.show({
      type: "success",
      text1: "Order Created",
      text2: "Your order has been placed successfully",
      position: "bottom"
    });

    return data.order;
  } catch (err) {
    dispatch({
      type: ORDER_ERROR,
      payload: err.message
    });

    Toast.show({
      type: "error",
      text1: "Order Failed",
      text2: err.message || "Failed to create order",
      position: "bottom"
    });

    throw err;
  }
};

export const getUserOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LOADING });
    
    const token = await AsyncStorage.getItem("jwt");
    const response = await fetch(`${baseURL}/orders`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    const data = await response.json();
    
    dispatch({
      type: GET_USER_ORDERS_SUCCESS,
      payload: data.orders
    });

    return data.orders;
  } catch (err) {
    dispatch({
      type: ORDER_ERROR,
      payload: err.message
    });

    Toast.show({
      type: "error",
      text1: "Fetch Error",
      text2: err.message || "Failed to fetch your orders",
      position: "bottom"
    });

    throw err;
  }
};

export const getAllOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LOADING });
    
    const token = await AsyncStorage.getItem("jwt");
    const response = await fetch(`${baseURL}/admin/orders`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all orders");
    }

    const data = await response.json();
    
    dispatch({
      type: GET_ALL_ORDERS_SUCCESS,
      payload: data.orders
    });

    return data.orders;
  } catch (err) {
    dispatch({
      type: ORDER_ERROR,
      payload: err.message
    });

    Toast.show({
      type: "error",
      text1: "Fetch Error",
      text2: err.message || "Failed to fetch orders",
      position: "bottom"
    });

    throw err;
  }
};

export const updateOrder = (orderId, updateData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LOADING });
    
    const token = await AsyncStorage.getItem("jwt");
    const response = await fetch(`${baseURL}/admin/orders/update`, {
      method: "PUT",
      body: JSON.stringify({ orderId, ...updateData }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to update order");
    }

    const data = await response.json();
    
    dispatch({
      type: UPDATE_ORDER_SUCCESS,
      payload: data.order
    });

    Toast.show({
      type: "success",
      text1: "Order Updated",
      text2: "Order has been updated successfully",
      position: "bottom"
    });

    return data.order;
  } catch (err) {
    dispatch({
      type: ORDER_ERROR,
      payload: err.message
    });

    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: err.message || "Failed to update order",
      position: "bottom"
    });

    throw err;
  }
};

export const deleteOrder = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LOADING });
    
    const token = await AsyncStorage.getItem("jwt");
    const response = await fetch(`${baseURL}/admin/orders/delete`, {
      method: "DELETE",
      body: JSON.stringify({ orderId }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete order");
    }

    const data = await response.json();
    
    dispatch({
      type: DELETE_ORDER_SUCCESS,
      payload: orderId
    });

    Toast.show({
      type: "success",
      text1: "Order Deleted",
      text2: "Order has been deleted successfully",
      position: "bottom"
    });

    return true;
  } catch (err) {
    dispatch({
      type: ORDER_ERROR,
      payload: err.message
    });

    Toast.show({
      type: "error",
      text1: "Delete Error",
      text2: err.message || "Failed to delete order",
      position: "bottom"
    });

    throw err;
  }
};

export const getSalesStats = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LOADING });
    
    const token = await AsyncStorage.getItem("jwt");
    const response = await fetch(`${baseURL}/admin/orders/delivered-stats`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sales stats");
    }

    const data = await response.json();
    
    dispatch({
      type: GET_SALES_STATS_SUCCESS,
      payload: data.stats
    });

    return data.stats;
  } catch (err) {
    dispatch({
      type: ORDER_ERROR,
      payload: err.message
    });

    Toast.show({
      type: "error",
      text1: "Stats Error",
      text2: err.message || "Failed to fetch sales statistics",
      position: "bottom"
    });

    throw err;
  }
};