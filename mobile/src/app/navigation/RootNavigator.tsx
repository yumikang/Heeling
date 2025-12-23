import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Colors } from '../../constants';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PremiumScreen from '../screens/PremiumScreen';
import SearchScreen from '../screens/SearchScreen';
import ContentPageScreen from '../screens/ContentPageScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ContentPage"
        component={ContentPageScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Playlist"
        component={PlaylistScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
