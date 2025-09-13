import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import StorageListScreen from '../screens/StorageListScreen';
import AddStorageSpaceScreen from '../screens/AddStorageSpaceScreen';
import StorageDetailScreen from '../screens/StorageDetailScreen';
import LocationDetailScreen from '../screens/LocationDetailScreen';
import EditItemScreen from '../screens/EditItemScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen 
            name="StorageList" 
            component={StorageListScreen} 
          />
          <Stack.Screen 
            name="AddStorageSpace" 
            component={AddStorageSpaceScreen} 
          />
          <Stack.Screen 
            name="StorageDetail" 
            component={StorageDetailScreen} 
          />
          <Stack.Screen 
            name="LocationDetail" 
            component={LocationDetailScreen} 
          />
          <Stack.Screen 
            name="EditItem" 
            component={EditItemScreen} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}