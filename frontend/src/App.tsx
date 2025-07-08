import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from './AppRouter';
import CustomNavbar from './components/CustomNavbar';
import { AuthProvider } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <CustomNavbar />
                    <div className="container mt-4">
                        <AppRouter />
                    </div>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;