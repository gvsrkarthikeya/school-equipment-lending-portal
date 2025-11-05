import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function StaffView() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/');
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Welcome, Staff!</h2>
            <button onClick={handleLogout} style={{ marginTop: 10 }}>Logout</button>
        </div>
    );
}

export default StaffView;
