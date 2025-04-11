// Actions/Auth.actions.js
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";

export const SET_CURRENT_USER = "SET_CURRENT_USER";
export const LOGOUT_USER = "LOGOUT_USER";
export const AUTH_ERROR = "AUTH_ERROR";

export const loginUser = (user) => async (dispatch) => {
    try {
        const res = await fetch(`${baseURL}/login`, {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        
        const data = await res.json();
        if (!res.ok) {
            throw data;
        }
        
        const token = data.token;
        await AsyncStorage.setItem("jwt", token);
        const decoded = jwtDecode(token);
        
        dispatch(setCurrentUser(decoded, data.user));
        
        Toast.show({
            type: "success",
            text1: "Login Successful",
            text2: `Welcome back, ${data.user.name}`,
            position: "bottom"
        });
        
        return true; // Return success flag
    } catch (err) {
        Toast.show({
            type: "error",
            text1: "Login Failed",
            text2: err.message || "Please provide correct credentials",
            position: "bottom"
        });
        
        dispatch({
            type: AUTH_ERROR,
            payload: err.message || "Login failed"
        });
        
        // Remove this line - it was causing the logout message to appear
        // dispatch(logoutUser());
        
        return false; // Return failure flag
    }
};

export const getUserProfile = (id) => async (dispatch) => {
    try {
        const token = await AsyncStorage.getItem("jwt");
        const response = await fetch(`${baseURL}/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        dispatch(setCurrentUser(jwtDecode(token), data.user));
    } catch (err) {
        Toast.show({
            type: "error",
            text1: "Profile Error",
            text2: err.message,
            position: "bottom"
        });
        
        dispatch({
            type: AUTH_ERROR,
            payload: err.message
        });
    }
};

export const logoutUser = () => async (dispatch) => {
    try {
        await AsyncStorage.removeItem("jwt");
        
        dispatch({
            type: LOGOUT_USER
        });
        
        Toast.show({
            type: "success",
            text1: "Logged Out",
            text2: "You have been successfully logged out",
            position: "bottom"
        });
        
        return true; // Return success flag
    } catch (err) {
        Toast.show({
            type: "error",
            text1: "Logout Error",
            text2: "Failed to clear session",
            position: "bottom"
        });
        
        return false; // Return failure flag
    }
};

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user
    };
};

export const checkAuth = () => async (dispatch) => {
    try {
        const token = await AsyncStorage.getItem("jwt");
        if (token) {
            const decoded = jwtDecode(token);
            // Check if token is expired
            if (decoded.exp * 1000 < Date.now()) {
                dispatch(logoutUser());
            } else {
                dispatch(setCurrentUser(decoded));
                // Fetch fresh user data
                dispatch(getUserProfile(decoded.userId || decoded.id));
            }
        } else {
            // If no token exists, ensure we're in logged out state
            dispatch({ type: LOGOUT_USER });
        }
    } catch (err) {
        dispatch(logoutUser());
    }
};