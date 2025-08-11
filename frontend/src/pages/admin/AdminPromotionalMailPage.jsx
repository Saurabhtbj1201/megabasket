import React from 'react';
import Meta from '../../components/Meta';
import './AdminPromotionalMailPage.css';

const AdminPromotionalMailPage = () => {
    return (
        <>
            <Meta title="Send Promotional Emails | Admin" noIndex={true} />
            <div className="promotional-mail-page">
                <div className="page-header">
                    <h1>Send Promotional Emails</h1>
                    <p className="subtitle">Create and send marketing campaigns to your customers</p>
                </div>
                
                <div className="content-container">
                    {/* Placeholder content - will be replaced later */}
                    <div className="placeholder-content">
                        <h2>Email Marketing Tools</h2>
                        <p>This section will contain tools for creating and sending promotional emails to customers.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminPromotionalMailPage;
