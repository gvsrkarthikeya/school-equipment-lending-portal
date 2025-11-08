import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
const { useNavigate } = require('react-router-dom');

const API_URL = 'http://localhost:3001/api';

function RoleBasedDashboard() {
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    // For demo, hardcode current user
    const currentUser = 'student1';
    // Get unique categories from equipment
    const categories = Array.from(new Set(equipment.map(eq => eq.category).filter(Boolean)));
    const location = useLocation();
    const [role] = useState(location.state?.role || 'student');
    // Fetch equipment and requests on mount
    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API_URL}/equipment`),
            axios.get(`${API_URL}/requests`)
        ]).then(([equipRes, reqRes]) => {
            setEquipment(equipRes.data);
            setRequests(reqRes.data);
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
        const newEq = { ...formData, available: formData.quantity };
        const res = await axios.post(`${API_URL}/equipment`, newEq);
        setEquipment([...equipment, res.data]);
        setFormData({ name: '', category: '', condition: '', quantity: 1 });
        setShowForm(false);
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
        await axios.put(`${API_URL}/equipment/${editId}`, editFormData);
        setEquipment(equipment.map(eq => eq._id === editId ? { ...eq, ...editFormData } : eq));
        setEditId(null);
    };

    const handleEditCancel = () => {
        setEditId(null);
    };

    // Delete equipment (admin)
    const handleDelete = async (id) => {
        setShowDeleteModal(false);
        await axios.delete(`${API_URL}/equipment/${deleteItemId}`);
        setEquipment(equipment.filter(eq => eq._id !== deleteItemId));
        setDeleteItemId(null);
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
        const newReq = { equipmentId: id, user: 'student1', status: 'pending' };
        const res = await axios.post(`${API_URL}/requests`, newReq);
        setRequests([...requests, res.data]);
        alert('Request sent!');
    };

    // Approve/Reject request (staff/admin)
    const handleApprove = async (reqId) => {
        await axios.put(`${API_URL}/requests/${reqId}`, { status: 'approved' });
        setRequests(requests.map(r => r._id === reqId ? { ...r, status: 'approved' } : r));
        // Decrement available
        const req = requests.find(r => r._id === reqId);
        setEquipment(equipment.map(eq => {
            if (eq._id === req.equipmentId && eq.available > 0) {
                return { ...eq, available: eq.available - 1 };
            }
            return eq;
        }));
    };
    const handleReject = async (reqId) => {
        await axios.put(`${API_URL}/requests/${reqId}`, { status: 'rejected' });
        setRequests(requests.map(r => r._id === reqId ? { ...r, status: 'rejected' } : r));
    };

    // Mark as returned (staff/admin)
    const handleReturn = async (reqId) => {
        await axios.put(`${API_URL}/requests/${reqId}`, { status: 'returned' });
        const req = requests.find(r => r._id === reqId);
        setEquipment(equipment.map(eq => eq._id === req.equipmentId ? { ...eq, available: eq.available + 1 } : eq));
        setRequests(requests.map(r => r._id === reqId ? { ...r, status: 'returned' } : r));
    };


    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
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

    // Status Badge Component
    const StatusBadge = ({ status }) => {
        const getStatusStyle = () => {
            const baseStyle = {
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
            };

            switch (status) {
                case 'pending':
                    return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' };
                case 'approved':
                    return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
                case 'rejected':
                    return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' };
                case 'returned':
                    return { ...baseStyle, backgroundColor: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' };
                default:
                    return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41', border: '1px solid #d6d8db' };
            }
        };

        return <span style={getStatusStyle()}>{status}</span>;
    };

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
                <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>
                    🚪 Logout
                </button>
            </div>
            <hr />
            <div className="dashboard-controls">
                <input placeholder="🔍 Search by name or category" value={search} onChange={e => setSearch(e.target.value)} />
                <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                {role === 'admin' && <button onClick={() => setShowForm(!showForm)}>➕ Add Equipment</button>}
            </div>
            {showForm && role === 'admin' && (
                <form onSubmit={handleAdd}>
                    <input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    <input placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                    <input placeholder="Condition" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} required />
                    <input type="number" min={1} placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
                    <button type="submit">✅ Add</button>
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
                                                <button className="edit-btn" type="button" onClick={handleEditSave}>💾 Save</button>
                                                <button className="edit-btn" type="button" onClick={handleEditCancel}>❌ Cancel</button>
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
                                                            📋 Request
                                                        </button>
                                                    );
                                                })()}
                                                {role === 'admin' && <>
                                                    <button onClick={() => handleEditClick(eq)}>✏️ Edit</button>
                                                    <button onClick={() => openDeleteModal(eq._id)}>🗑️ Delete</button>
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
                                            <td><StatusBadge status={r.status} /></td>
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
                                        <td><StatusBadge status={r.status} /></td>
                                        <td>
                                            {r.status === 'pending' && <>
                                                <button onClick={() => handleApprove(r._id)}>✅ Approve</button>
                                                <button onClick={() => handleReject(r._id)}>❌ Reject</button>
                                            </>}
                                            {r.status === 'approved' && <button onClick={() => handleReturn(r._id)}>↩️ Mark as Returned</button>}
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
