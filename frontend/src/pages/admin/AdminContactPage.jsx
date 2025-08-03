import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import ConfirmationModal from '../../components/ConfirmationModal';
import Meta from '../../components/Meta';
import './AdminContactPage.css';

const AdminContactPage = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('New');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState(null);

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/contact', config);
            setSubmissions(data);
        } catch (error) {
            toast.error('Failed to fetch contact submissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleStatusChange = async (id, status) => {
        try {
            await axios.put(`/api/contact/${id}/status`, { status }, config);
            toast.success('Status updated successfully!');
            fetchSubmissions();
        } catch (error) {
            toast.error('Failed to update status.');
        }
    };

    const handleDeleteClick = (id) => {
        setSubmissionToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/contact/${submissionToDelete}`, config);
            toast.success('Submission deleted successfully!');
            fetchSubmissions();
        } catch (error) {
            toast.error('Failed to delete submission.');
        } finally {
            setShowConfirmModal(false);
            setSubmissionToDelete(null);
        }
    };

    const submissionCounts = useMemo(() => {
        const counts = { New: 0, 'In Progress': 0, Resolved: 0, All: submissions.length };
        submissions.forEach(s => {
            if (counts[s.status] !== undefined) {
                counts[s.status]++;
            }
        });
        return counts;
    }, [submissions]);

    const filteredSubmissions = useMemo(() => {
        if (activeTab === 'All') return submissions;
        return submissions.filter(s => s.status === activeTab);
    }, [submissions, activeTab]);

    const statuses = ['New', 'In Progress', 'Resolved'];

    return (
        <>
            <Meta title="Admin: Contact Submissions" noIndex={true} />
            <div>
                <h1>Contact Form Submissions</h1>
                <div className="tabs-container">
                    {['New', 'In Progress', 'Resolved', 'All'].map(status => (
                        <button
                            key={status}
                            className={`tab-btn ${activeTab === status ? 'active' : ''}`}
                            onClick={() => setActiveTab(status)}
                        >
                            {status} <span className="product-tab-count">{submissionCounts[status]}</span>
                        </button>
                    ))}
                </div>

                <div className="submission-list">
                    {loading ? <p>Loading submissions...</p> : filteredSubmissions.map(sub => (
                        <div key={sub._id} className="submission-card">
                            <div className="submission-header">
                                <div>
                                    <strong>{sub.name}</strong> ({sub.email})
                                    {sub.phone && ` - ${sub.phone}`}
                                </div>
                                <span>{new Date(sub.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="submission-body">
                                <p><strong>Subject:</strong> {sub.subject}</p>
                                {sub.orderId && <p><strong>Order ID:</strong> {sub.orderId}</p>}
                                <p className="submission-message">{sub.message}</p>
                            </div>
                            <div className="submission-footer">
                                <select
                                    value={sub.status}
                                    onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                                    className="status-select"
                                >
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button className="delete-btn" onClick={() => handleDeleteClick(sub._id)}>
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredSubmissions.length === 0 && <p>No submissions found for this category.</p>}
                </div>
            </div>
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="Delete Submission"
                message="Are you sure you want to delete this submission? This action cannot be undone."
            />
        </>
    );
};

export default AdminContactPage;
