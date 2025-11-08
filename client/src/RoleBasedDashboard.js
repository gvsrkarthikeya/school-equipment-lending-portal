import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

function RoleBasedDashboard() {
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [currentUser, setCurrentUser] = useState('');
    // Get unique categories from equipment
    const categories = Array.from(new Set(equipment.map(eq => eq.category).filter(Boolean)));
    const location = useLocation();
    const [role, setRole] = useState(location.state?.role || 'student');
    
    // Fetch current user info from /api/me
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get(`${API_URL}/me`)
                .then(res => {
                    // Phase 2 API returns { success: true, user: { id, username, role } }
                    const userData = res.data.user || res.data;
                    setCurrentUser(userData.username);
                    if (userData.role) setRole(userData.role);
                })
                .catch(err => {
                    console.error('Error fetching user info:', err);
                });
        }
    }, []);
    
    // Fetch equipment and requests on mount
    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API_URL}/equipment`),
            axios.get(`${API_URL}/requests`)
        ]).then(([equipRes, reqRes]) => {
            // Phase 2 API returns { success, data, count } format
            setEquipment(equipRes.data.data || equipRes.data);
            setRequests(reqRes.data.data || reqRes.data);
            setLoading(false);
        }).catch(err => {
            console.error('Error loading data:', err);
            setLoading(false);
        });
    }, []);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: '', condition: '', quantity: 1 });
    // Edit state
    const [editId, setEditId] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', category: '', condition: '', quantity: 1 });

    // Filter equipment
    const filtered = equipment.filter(eq =>
        (eq.name.toLowerCase().includes(search.toLowerCase()) || eq.category.toLowerCase().includes(search.toLowerCase())) &&
        (category ? eq.category === category : true)
    );

    // Add equipment
    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const newEq = { ...formData, available: formData.quantity };
            const res = await axios.post(`${API_URL}/equipment`, newEq);
            // Phase 2 API returns { success, data }
            setEquipment([...equipment, res.data.data || res.data]);
            setFormData({ name: '', category: '', condition: '', quantity: 1 });
            setShowForm(false);
        } catch (err) {
            alert(`Failed to add equipment: ${err.response?.data?.message || err.message}`);
        }
    };

    // Edit equipment (admin)
    const handleEditClick = (eq) => {
        setEditId(eq._id);
        setEditFormData({
            name: eq.name,
            category: eq.category,
            condition: eq.condition,
            quantity: eq.quantity,
            available: eq.available
        });
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/equipment/${editId}`, editFormData);
            setEquipment(equipment.map(eq => eq._id === editId ? { ...eq, ...editFormData } : eq));
            setEditId(null);
        } catch (err) {
            alert(`Failed to update equipment: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleEditCancel = () => {
        setEditId(null);
    };

    // Delete equipment (admin)
    const handleDelete = async (id) => {
        try {
            setShowDeleteModal(false);
            await axios.delete(`${API_URL}/equipment/${deleteItemId}`);
            setEquipment(equipment.filter(eq => eq._id !== deleteItemId));
            setDeleteItemId(null);
        } catch (err) {
            alert(`Failed to delete equipment: ${err.response?.data?.message || err.message}`);
            setDeleteItemId(null);
        }
    };

    const openDeleteModal = (id) => {
        setDeleteItemId(id);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteItemId(null);
    };

    // Request to borrow (student)
    const handleRequest = async (id) => {
        try {
            const newReq = { equipmentId: id, user: currentUser, status: 'pending' };
            const res = await axios.post(`${API_URL}/requests`, newReq);
            // Phase 2 API returns { success, data }
            setRequests([...requests, res.data.data || res.data]);
            alert('Request sent!');
        } catch (err) {
            alert(`Failed to send request: ${err.response?.data?.message || err.message}`);
        }
    };

    // Approve/Reject request (staff/admin)
    const handleApprove = async (reqId) => {
        try {
            const res = await axios.put(`${API_URL}/requests/${reqId}`, { status: 'approved' });
            const updatedRequest = res.data.data || res.data;
            setRequests(requests.map(r => r._id === reqId ? { ...r, status: 'approved' } : r));
            // Decrement available
            const req = requests.find(r => r._id === reqId);
            setEquipment(equipment.map(eq => {
                if (eq._id === req.equipmentId && eq.available > 0) {
                    return { ...eq, available: eq.available - 1 };
                }
                return eq;
            }));
        } catch (err) {
            alert(`Failed to approve request: ${err.response?.data?.message || err.message}`);
        }
    };
    const handleReject = async (reqId) => {
        try {
            const res = await axios.put(`${API_URL}/requests/${reqId}`, { status: 'rejected' });
            const updatedRequest = res.data.data || res.data;
            setRequests(requests.map(r => r._id === reqId ? { ...r, status: 'rejected' } : r));
        } catch (err) {
            alert(`Failed to reject request: ${err.response?.data?.message || err.message}`);
        }
    };

    // Mark as returned (staff/admin)
    const handleReturn = async (reqId) => {
        try {
            const res = await axios.put(`${API_URL}/requests/${reqId}`, { status: 'returned' });
            const updatedRequest = res.data.data || res.data;
            const req = requests.find(r => r._id === reqId);
            setEquipment(equipment.map(eq => eq._id === req.equipmentId ? { ...eq, available: eq.available + 1 } : eq));
            setRequests(requests.map(r => r._id === reqId ? { ...r, status: 'returned' } : r));
        } catch (err) {
            alert(`Failed to mark as returned: ${err.response?.data?.message || err.message}`);
        }
    };

    // Fetch usage analytics
    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(`${API_URL}/analytics/equipment`);
            setAnalytics(res.data.data || res.data);
            setShowAnalytics(true);
        } catch (err) {
            alert(`Failed to load analytics: ${err.response?.data?.message || err.message}`);
        }
    };


    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/');
    };

    // Loading Skeleton Component
    const LoadingSkeleton = () => (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                height: '40px', 
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s infinite',
                borderRadius: '4px',
                marginBottom: '20px'
            }}></div>
            <div style={{ 
                height: '200px', 
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'loading 1.5s infinite',
                borderRadius: '4px',
                marginBottom: '20px'
            }}></div>
            <style>
                {`
                    @keyframes loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}
            </style>
        </div>
    );

    // Confirmation Modal Component
    const ConfirmationModal = ({ show, onClose, onConfirm, itemName }) => {
        if (!show) return null;
        
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '400px',
                    width: '90%'
                }}>
                    <h3 style={{ marginTop: 0, color: '#333' }}>Confirm Delete</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Are you sure you want to delete "{itemName}"? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>
                    {role === 'student'
                        ? 'Student Equipment Dashboard'
                        : role === 'staff'
                            ? 'Staff Equipment Dashboard'
                            : 'Admin Equipment Dashboard'}
                </h2>
                <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Logout</button>
            </div>
            <hr />
            <div className="dashboard-controls">
                <input placeholder="Search by name or category" value={search} onChange={e => setSearch(e.target.value)} />
                <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                {role === 'admin' && <button onClick={() => setShowForm(!showForm)}>Add Equipment</button>}
            </div>
            {showForm && role === 'admin' && (
                <form onSubmit={handleAdd}>
                    <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <input placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                    <input placeholder="Condition" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} required />
                    <input type="number" min={1} placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
                    <button type="submit">Add</button>
                </form>
            )}
            <table className="equipment-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Condition</th>
                        <th>Quantity</th>
                        <th>Available</th>
                        {(role === 'student' || role === 'admin') && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={role === 'student' || role === 'admin' ? 6 : 5} style={{ textAlign: 'center' }}>No data to display</td>
                        </tr>
                    ) : (
                        filtered.map(eq => (
                            <tr key={eq._id}>
                                {editId === eq._id ? (
                                    <>
                                        <td><input className="edit-input" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required /></td>
                                        <td>
                                            <select className="edit-input" value={editFormData.category} onChange={e => setEditFormData({ ...editFormData, category: e.target.value })} required>
                                                <option value="">Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td><input className="edit-input" value={editFormData.condition} onChange={e => setEditFormData({ ...editFormData, condition: e.target.value })} required /></td>
                                        <td><input className="edit-input" type="number" min={1} value={editFormData.quantity} onChange={e => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })} required /></td>
                                        <td>{editFormData.available}</td>
                                        {(role === 'student' || role === 'admin') && (
                                            <td>
                                                <button className="edit-btn" type="button" onClick={handleEditSave}>Save</button>
                                                <button className="edit-btn" type="button" onClick={handleEditCancel}>Cancel</button>
                                            </td>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <td>{eq.name}</td>
                                        <td>{eq.category}</td>
                                        <td>{eq.condition}</td>
                                        <td>{eq.quantity}</td>
                                        <td>{eq.available}</td>
                                        {(role === 'student' || role === 'admin') && (
                                            <td>
                                                {role === 'student' && (() => {
                                                    // Check if current user has a pending or approved request for this equipment
                                                    const hasPending = requests.some(r => r.equipmentId === eq._id && r.user === currentUser && r.status === 'pending');
                                                    const hasApproved = requests.some(r => r.equipmentId === eq._id && r.user === currentUser && r.status === 'approved');
                                                    const disabled = eq.available === 0 || hasPending || hasApproved;
                                                    let style = {};
                                                    if (hasPending || hasApproved) {
                                                        style = { background: '#eee', color: '#888', cursor: 'not-allowed' };
                                                    }
                                                    return (
                                                        <button
                                                            onClick={() => handleRequest(eq._id)}
                                                            disabled={disabled}
                                                            style={style}
                                                        >
                                                            Request
                                                        </button>
                                                    );
                                                })()}
                                                {role === 'admin' && <>
                                                    <button onClick={() => handleEditClick(eq)}>Edit</button>
                                                    <button onClick={() => openDeleteModal(eq._id)}>Delete</button>
                                                </>}
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            {/* Delete Confirmation Modal */}
            <ConfirmationModal 
                show={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={equipment.find(eq => eq._id === deleteItemId)?.name || 'this item'}
            />
            
            <hr />
            {/* Show assigned items for student */}
            {role === 'student' && (
                <div style={{ margin: '2em 0' }}>
                    <h3>Assigned Equipment</h3>
                    <table className="equipment-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Condition</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.filter(r => r.user === currentUser && r.status === 'approved').length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center' }}>No assigned equipment</td>
                                </tr>
                            ) : (
                                requests.filter(r => r.user === currentUser && r.status === 'approved').map(r => {
                                    const eq = equipment.find(eq => eq._id === r.equipmentId);
                                    if (!eq) return null;
                                    return (
                                        <tr key={r._id}>
                                            <td>{eq.name}</td>
                                            <td>{eq.category}</td>
                                            <td>{eq.condition}</td>
                                            <td>{r.status}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {(role === 'staff' || role === 'admin') && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Usage Analytics</h3>
                        <button onClick={fetchAnalytics} style={{ marginBottom: '10px' }}>
                            {showAnalytics ? 'Refresh Analytics' : 'Show Analytics'}
                        </button>
                    </div>
                    {showAnalytics && (
                        <table className="equipment-table" style={{ marginBottom: '2em' }}>
                            <thead>
                                <tr>
                                    <th>Equipment</th>
                                    <th>Category</th>
                                    <th>Total Quantity</th>
                                    <th>Times Borrowed</th>
                                    <th>Times Returned</th>
                                    <th>Currently Out</th>
                                    <th>Last Borrowed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center' }}>No analytics data</td>
                                    </tr>
                                ) : (
                                    analytics.map(eq => (
                                        <tr key={eq._id}>
                                            <td>{eq.name}</td>
                                            <td>{eq.category}</td>
                                            <td>{eq.quantity}</td>
                                            <td>{eq.borrowCount || 0}</td>
                                            <td>{eq.returnCount || 0}</td>
                                            <td>{(eq.borrowCount || 0) - (eq.returnCount || 0)}</td>
                                            <td>{eq.lastBorrowedAt ? new Date(eq.lastBorrowedAt).toLocaleDateString() : 'Never'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                    <h3>Borrow Requests</h3>
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center' }}>No requests</td>
                                </tr>
                            ) : (
                                requests.map(r => (
                                    <tr key={r._id}>
                                        <td>{equipment.find(eq => eq._id === r.equipmentId)?.name}</td>
                                        <td>{r.user}</td>
                                        <td>{r.status}</td>
                                        <td>
                                            {r.status === 'pending' && <>
                                                <button onClick={() => handleApprove(r._id)}>Approve</button>
                                                <button onClick={() => handleReject(r._id)}>Reject</button>
                                            </>}
                                            {r.status === 'approved' && <button onClick={() => handleReturn(r._id)}>Mark as Returned</button>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default RoleBasedDashboard;
