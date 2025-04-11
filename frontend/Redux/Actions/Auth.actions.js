// Actions/Auth.actions.js
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";
import { resetToHome } from '../../Navigators/NavigationService';
export const SET_CURRENT_USER = "SET_CURRENT_USER";
export const LOGOUT_USER = "LOGOUT_USER";
export const AUTH_ERROR = "AUTH_ERROR";
import { syncCartWithServer } from '../../Utils/CartSync';

export const loginUser = (user) => async (dispatch) => {
    try {
        console.log(`Attempting to connect to: ${baseURL}/login`);
        
        const res = await fetch(`${baseURL}/login`, {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
        
        console.log("Response status:", res.status);
        
        const data = await res.json();
        
        if (!res.ok) {
            console.log("Error response:", data);
            throw data;
        }
        
        console.log("Login successful");
        const token = data.token;
        await AsyncStorage.setItem("jwt", token);
        const decoded = jwtDecode(token);
        
        dispatch(setCurrentUser(decoded, data.user));
        await syncCartWithServer(token);
        Toast.show({
            type: "success",
            text1: "Login Successful",
            text2: `Welcome back, ${data.user.name}`,
            position: "bottom"
        });
        
        return true; // Return success flag
    } catch (err) {
        console.error("Login error details:", err);
        
        // Handle network errors specifically
        if (err.message && err.message.includes('Network request failed')) {
            Toast.show({
                type: "error",
                text1: "Network Error",
                text2: "Cannot connect to the server. Please check your connection.",
                position: "bottom"
            });
        } else {
            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: err.message || "Please provide correct credentials",
                position: "bottom"
            });
        }
        
        dispatch({
            type: AUTH_ERROR,
            payload: err.message || "Login failed"
        });
        
        return false; // Return failure flag
    }
};

// Rest of your code remains the same

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
            type: LOGOUT_USER,
            payload: null
        });
        
        resetToHome(); // Use the navigation service
        
        Toast.show({
            type: "success",
            text1: "Logged Out",
            text2: "You have been successfully logged out",
            position: "bottom"
        });
        
        return true;
    } catch (err) {
        Toast.show({
            type: "error",
            text1: "Logout Error",
            text2: "Failed to clear session",
            position: "bottom"
        });
        return false;
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
            if (decoded.exp * 1000 < Date.now()) {
                dispatch(logoutUser());
            } else {
                dispatch(setCurrentUser(decoded));
                // Fetch fresh user data
                await dispatch(getUserProfile(decoded.userId || decoded.id));
                // Sync cart after auth check
                await syncCartWithServer(token);
            }
        } else {
            dispatch({ type: LOGOUT_USER });
        }
    } catch (err) {
        dispatch(logoutUser());
    }
};