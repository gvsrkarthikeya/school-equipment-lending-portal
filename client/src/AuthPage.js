import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const roles = ['student', 'staff', 'admin'];

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [signupData, setSignupData] = useState({ username: '', password: '', role: 'student' });
    const navigate = useNavigate();

    // Signup
    const handleSignup = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post('http://localhost:3001/api/signup', signupData);

        if (response.data.message === 'success') {
            alert('Signup successful! You can now login.');
            setIsLogin(true);
        } else {
            alert(response.data.message || 'Username already exists!');
        }
    } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
            alert(err.response.data.message);
        } else {
            alert('Unable to Signup, Please try again later.');
        }
    }
};

    // Login
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/api/login', loginData);
            // Expecting { token, role } from server
            const { token, role, message } = response.data;
            if (token && role) {
                localStorage.setItem('token', token); // Store token for future requests
                navigate('/dashboard', { state: { role } });
            } else {
                alert(message || 'Invalid credentials!');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                alert(err.response.data.message);
            } else {
                alert('Server error. Please try again later.');
            }
        }
    };

    return (
        <div style={{ 
            maxWidth: 400, 
            margin: '40px auto', 
            padding: '30px', 
            border: '1px solid #ddd', 
            borderRadius: 8,
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
                {isLogin ? 'Login' : 'Signup'}
            </h2>
            {isLogin ? (
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={loginData.username}
                        onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                    <button type="submit" style={{ width: '100%', padding: '12px' }}>Login</button>
                    <div style={{ marginTop: 15, textAlign: 'center' }}>
                        <span style={{ color: '#666' }}>Don't have an account? </span>
                        <button 
                            type="button" 
                            onClick={() => setIsLogin(false)}
                            style={{ background: 'transparent', color: '#4CAF50', padding: '5px 10px' }}
                        >
                            Signup
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleSignup}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={signupData.username}
                        onChange={e => setSignupData({ ...signupData, username: e.target.value })}
                        required
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={signupData.password}
                        onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                    <select
                        value={signupData.role}
                        onChange={e => setSignupData({ ...signupData, role: e.target.value })}
                        style={{ width: '100%', marginBottom: 10 }}
                    >
                        {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <button type="submit" style={{ width: '100%', padding: '12px' }}>Signup</button>
                    <div style={{ marginTop: 15, textAlign: 'center' }}>
                        <span style={{ color: '#666' }}>Already have an account? </span>
                        <button 
                            type="button" 
                            onClick={() => setIsLogin(true)}
                            style={{ background: 'transparent', color: '#4CAF50', padding: '5px 10px' }}
                        >
                            Login
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default AuthPage;
