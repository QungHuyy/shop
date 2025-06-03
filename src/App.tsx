import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, createTheme, CssBaseline, Container, Button } from '@mui/material';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return <>{children}</>;
};

// Home component
const Home: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <h1>Welcome to Our Shop</h1>
      <Button variant="contained" color="secondary" onClick={signOut}>
        Sign Out
      </Button>
    </Container>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 