// navigation/MainNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DrawerNavigator from './DrawerNavigator';
import AdminDrawerNavigator from './AdminDrawerNavigator';
import AuthListener from '../Shared/AuthListener';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="App" component={DrawerNavigator} />
        <Stack.Screen name="AdminDashboard" component={AdminDrawerNavigator} />
      </Stack.Navigator>
      <AuthListener />
    </>
  );
};

export default MainNavigator;