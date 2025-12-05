import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import ProblemList from './ProblemList';
import ProblemForm from './ProblemForm';
import CSVManager from './CSVManager';

const AdminDashboard = ({ user }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'
    const [editingProblem, setEditingProblem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminRole = async () => {
            try {
                const idTokenResult = await user.getIdTokenResult();
                if (idTokenResult.claims.role === 'admin') {
                    setIsAdmin(true);
                } else {
                    alert('Access Denied: Admins only.');
                    await signOut(auth);
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error checking admin role:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAdminRole();
    }, [user, navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    if (loading) return <div>Checking permissions...</div>;
    if (!isAdmin) return null;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Admin Dashboard</h1>
                <div>
                    <span style={{ marginRight: '15px' }}>{user.email}</span>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </div>
            </header>

            <div className="card">
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setView('list'); setEditingProblem(null); }}
                    >
                        Problem List
                    </button>
                    <button
                        className={`btn ${view === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setView('add'); setEditingProblem(null); }}
                    >
                        Add New Problem
                    </button>
                    <button
                        className={`btn ${view === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setView('csv'); setEditingProblem(null); }}
                    >
                        CSV Import/Export
                    </button>
                </div>

                {view === 'list' && (
                    <ProblemList
                        onEdit={(problem) => {
                            setEditingProblem(problem);
                            setView('edit');
                        }}
                    />
                )}

                {(view === 'add' || view === 'edit') && (
                    <ProblemForm
                        initialData={editingProblem}
                        onSuccess={() => {
                            setView('list');
                            setEditingProblem(null);
                        }}
                        onCancel={() => {
                            setView('list');
                            setEditingProblem(null);
                        }}
                    />
                )}

                {view === 'csv' && <CSVManager />}
            </div>
        </div>
    );
};

export default AdminDashboard;
