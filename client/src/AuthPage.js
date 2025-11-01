import React, { useState } from 'react';

const roles = ['student', 'staff', 'admin'];

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [signupData, setSignupData] = useState({ username: '', password: '', role: 'student' });


    // dummy users
    React.useEffect(() => {
        const users = localStorage.getItem('users');
        if (!users) {
            const dummyUsers = [
                { username: 'student1', password: 'pass123', role: 'student' },
                { username: 'staff1', password: 'pass123', role: 'staff' },
                { username: 'admin1', password: 'pass123', role: 'admin' }
            ];
            localStorage.setItem('users', JSON.stringify(dummyUsers));
        }
    }, []);

    // Temporarily get users from localStorage
    const getUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    // Signup handler
    const handleSignup = (e) => {
        e.preventDefault();
        const users = getUsers();
        if (users.find(u => u.username === signupData.username)) {
            alert('Username already exists!');
            return;
        }
        users.push(signupData);
        localStorage.setItem('users', JSON.stringify(users));
        alert('Signup successful! You can now login.');
        setIsLogin(true);
    };

    // Login handler
    const handleLogin = (e) => {
        e.preventDefault();
        const users = getUsers();
        const user = users.find(u => u.username === loginData.username && u.password === loginData.password);
        if (user) {
            alert(`Logged in as ${user.role}`);
        } else {
            alert('Invalid credentials!');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2>{isLogin ? 'Login' : 'Signup'}</h2>
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
                    <button type="submit" style={{ width: '100%' }}>Login</button>
                    <div style={{ marginTop: 10 }}>
                        <span>Don't have an account? </span>
                        <button type="button" onClick={() => setIsLogin(false)}>Signup</button>
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
                    <button type="submit" style={{ width: '100%' }}>Signup</button>
                    <div style={{ marginTop: 10 }}>
                        <span>Already have an account? </span>
                        <button type="button" onClick={() => setIsLogin(true)}>Login</button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default AuthPage;
