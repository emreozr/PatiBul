import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Colors from './src/styles/colors';
import ErrorBoundary from './src/components/ErrorBoundary';

// Auth Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SplashScreen from './src/screens/SplashScreen';

// User Screens
import UserHomeScreen from './src/screens/user/UserHomeScreen';
import CreateReportScreen from './src/screens/user/CreateReportScreen';
import NearbyVetsScreen from './src/screens/user/NearbyVetsScreen';
import UserProfileScreen from './src/screens/user/UserProfileScreen';
import AllReportsScreen from './src/screens/user/AllReportsScreen';
import MyReportsScreen from './src/screens/user/MyReportsScreen';
import ReportDetailScreen from './src/screens/user/ReportDetailScreen';
import ChangePasswordScreen from './src/screens/user/ChangePasswordScreen';
import InboxScreen from './src/screens/user/InboxScreen';
import ConversationScreen from './src/screens/user/ConversationScreen';
import FoundAnimalsScreen from './src/screens/user/FoundAnimalsScreen';
import EmergencyHelpScreen from './src/screens/user/EmergencyHelpScreen';
import AdminHomeScreen from './src/screens/admin/AdminHomeScreen';

// Vet Screens
import VetHomeScreen from './src/screens/vet/VetHomeScreen';
import VetReportDetailScreen from './src/screens/vet/VetReportDetailScreen';
import VetProfileScreen from './src/screens/vet/VetProfileScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();

const defaultScreenOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: 'bold' },
  headerBackTitleVisible: false,
};

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ ...defaultScreenOptions, title: 'Şifre Sıfırla', headerShown: true }}
      />
    </Stack.Navigator>
  );
}

function UserNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen name="UserHome" component={UserHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateReport" component={CreateReportScreen} options={{ title: 'Bildirim Oluştur' }} />
      <Stack.Screen name="EditReport" component={CreateReportScreen} options={{ title: 'İlanı Düzenle' }} />
      <Stack.Screen name="NearbyVets" component={NearbyVetsScreen} options={{ title: 'Yakındaki Veterinerler' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profilim' }} />
      <Stack.Screen name="AllReports" component={AllReportsScreen} options={{ title: 'Tüm İlanlar' }} />
      <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ title: 'Bildirimlerim' }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'İlan Detayı' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Şifre Değiştir' }} />
      <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Mesajlarım' }} />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={({ route }) => ({
          title: route.params?.otherUserName || '',
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen name="FoundAnimals" component={FoundAnimalsScreen} options={{ title: 'Bulunan Hayvanlar' }} />
      <Stack.Screen name="EmergencyHelp" component={EmergencyHelpScreen} options={{ title: '🐾 Pati - Acil Yardım' }} />
    </Stack.Navigator>
  );
}

function VetNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen name="VetHome" component={VetHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VetReportDetail" component={VetReportDetailScreen} options={{ title: 'Bildirim Detayı' }} />
      <Stack.Screen name="VetProfile" component={VetProfileScreen} options={{ title: 'Klinik Profilim' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Şifre Değiştir' }} />
    </Stack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { token, user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!token) return <AuthNavigator />;
  if (user?.role === 'admin') return <AdminNavigator />;
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