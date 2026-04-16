import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Colors from './src/styles/colors';
import ErrorBoundary from './src/components/ErrorBoundary';

// Auth Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// User Screens
import UserHomeScreen from './src/screens/user/UserHomeScreen';
import CreateReportScreen from './src/screens/user/CreateReportScreen';
import NearbyVetsScreen from './src/screens/user/NearbyVetsScreen';
import UserProfileScreen from './src/screens/user/UserProfileScreen';
import AllReportsScreen from './src/screens/user/AllReportsScreen';
import MyReportsScreen from './src/screens/user/MyReportsScreen';
import ReportDetailScreen from './src/screens/user/ReportDetailScreen';

// Vet Screens
import VetHomeScreen from './src/screens/vet/VetHomeScreen';
import VetReportDetailScreen from './src/screens/vet/VetReportDetailScreen';
import VetProfileScreen from './src/screens/vet/VetProfileScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function UserNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="UserHome"
        component={UserHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{ title: 'Bildirim Oluştur' }}
      />
      <Stack.Screen
        name="NearbyVets"
        component={NearbyVetsScreen}
        options={{ title: 'Yakındaki Veterinerler' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profilim' }}
      />
      <Stack.Screen
        name="AllReports"
        component={AllReportsScreen}
        options={{ title: 'Tüm İlanlar' }}
      />
      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ title: 'Bildirimlerim' }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: 'İlan Detayı' }}
      />
    </Stack.Navigator>
  );
}

function VetNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="VetHome"
        component={VetHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VetReportDetail"
        component={VetReportDetailScreen}
        options={{ title: 'Bildirim Detayı' }}
      />
      <Stack.Screen
        name="VetProfile"
        component={VetProfileScreen}
        options={{ title: 'Klinik Profilim' }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!token) return <AuthNavigator />;
  if (user?.role === 'vet') return <VetNavigator />;
  return <UserNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}