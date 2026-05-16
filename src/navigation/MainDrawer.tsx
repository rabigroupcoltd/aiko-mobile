import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MainTabs } from './MainTabs';
import { CustomDrawerContent } from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export const MainDrawer = ({ route }: any) => {
  const role = route.params?.role || 'PASSENGER';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} role={role} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '80%',
        },
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs} 
        initialParams={{ role }}
      />
    </Drawer.Navigator>
  );
};
