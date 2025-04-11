// AuthListener.js
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const AuthListener = () => {
    const navigation = useNavigation();
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const user = useSelector(state => state.auth.user);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            // Reset navigation stack to Home
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        }
    }, [isAuthenticated, user]);

    return null; // This component doesn't render anything
};

export default AuthListener;