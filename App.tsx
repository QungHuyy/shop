import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './contexts/AuthContext';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import { useAuth } from './contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

// Home component
const Home = () => {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Our Shop</Text>
      <Text style={styles.button} onPress={signOut}>
        Sign Out
      </Text>
    </View>
  );
};

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              // Public screens
              <>
                <Stack.Screen name="SignIn" component={SignIn} />
                <Stack.Screen name="SignUp" component={SignUp} />
              </>
            ) : (
              // Protected screens
              <>
                <Stack.Screen name="Home" component={Home} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#dc004e',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
});

export default App; 