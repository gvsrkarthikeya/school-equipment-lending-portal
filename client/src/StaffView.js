import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StaffView() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Welcome, Staff!</h2>
                <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                <p>Your staff dashboard will appear here.</p>
            </div>
        </div>
    );
}

export default StaffView;
