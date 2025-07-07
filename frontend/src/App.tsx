import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './AppRouter';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';

function App() {
  return (
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
  );
}

export default App;