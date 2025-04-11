import React, { useEffect, useReducer, useState } from "react";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from "../../Redux/Reducers/Auth.reducer";
import { setCurrentUser } from "../../Redux/Actions/Auth.actions";
import AuthGlobal from './AuthGlobal';

const Auth = props => {
    const [stateUser, dispatch] = useReducer(authReducer, {
        isAuthenticated: false,
        user: {}
    });
    const [showChild, setShowChild] = useState(false);

    useEffect(() => {
        setShowChild(true);
        
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem("jwt");
                if (token) {
                    const decoded = jwtDecode(token);
                    // Check if token is expired
                    if (decoded.exp * 1000 < Date.now()) {
                        // Token expired, do nothing (user will remain logged out)
                    } else {
                        // Valid token, set user
                        dispatch(setCurrentUser(decoded));
                    }
                }
            } catch (error) {
                console.log("Token validation error", error);
            }
        };
        
        checkToken();
        
        return () => setShowChild(false);
    }, []);

    if (!showChild) {
        return null;
    } else {
        return (
            <AuthGlobal.Provider
                value={{
                    stateUser,
                    dispatch
                }}
            >
                {props.children}
            </AuthGlobal.Provider>
        );
    }
};

export default Auth;