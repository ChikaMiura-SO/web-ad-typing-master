import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Admin/AdminDashboard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/admin"
                    element={user ? <AdminDashboard user={user} /> : <Navigate to="/login" />}
                />
                <Route path="/" element={<Navigate to="/admin" />} />
            </Routes>
        </Router>
    );
}

export default App;
