import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MainTabParamList } from '../../types';
import { Colors } from '../../constants';
import { useUserStore, useAuthStore } from '../../stores';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Components
import MiniPlayer from '../../components/player/MiniPlayer';
import { PopupManager } from '../../components/popup';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabBarIcon = ({
  name,
  focused
}: {
  name: string;
  focused: boolean;
}) => (
  <Icon
    name={name}
    size={24}
    color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
  />
);

const MainTabNavigator: React.FC = () => {
  const { userType } = useUserStore();
  const user = useAuthStore((state) => state.user);
  const isPremium = user?.isPremium ?? false;

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: '홈',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            tabBarLabel: '전체',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'musical-notes' : 'musical-notes-outline'} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{
            tabBarLabel: '좋아요',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'heart' : 'heart-outline'} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: '설정',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
      <MiniPlayer />
      <PopupManager userType={userType} isPremium={isPremium} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.tabBarBackground,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    height: 85,
    paddingBottom: 25,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MainTabNavigator;
