import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiCheck, FiX, FiMail, FiArrowRight, FiSave } from 'react-icons/fi';
import Meta from '../../components/Meta';
import './AdminPromotionalMailPage.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminPromotionalMailPage = () => {
    const [activeTab, setActiveTab] = useState('templates'); // Changed from 'write' to 'templates'
    const [templates, setTemplates] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    
    // Email state
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    
    // Add new state for workflow control
    const [workflowStep, setWorkflowStep] = useState('template'); 
    // Add state to control saving a direct email as template
    const [savingAsTemplate, setSavingAsTemplate] = useState(false);
    
    // Add new state for sent mail history
    const [sentMails, setSentMails] = useState([]);
    const [sentMailsLoading, setSentMailsLoading] = useState(false);
    
    // Fetch initial data - remove sample templates
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // Fetch templates and users in parallel
                const [templatesResponse, usersResponse] = await Promise.all([
                    axios.get('/api/email/templates', config),
                    axios.get('/api/email/users', config)
                ]);
                
                // Only use templates from database
                setTemplates(templatesResponse.data || []);
                setUsers(usersResponse.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch email data.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Handle template selection
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setEmailSubject(template.subject);
        setEmailBody(template.body);
        setTemplateName(template.name);
    };

    // Add new function to use selected template
    const handleUseTemplate = () => {
        setActiveTab('write');
        setWorkflowStep('compose');
    };

    // Handle new template creation
    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setEmailSubject('');
        setEmailBody('');
        setTemplateName('New Template');
        setIsEditingTemplate(true);
    };

    // Handle template edit
    const handleEditTemplate = () => {
        setIsEditingTemplate(true);
    };

    // Toggle the direct save as template mode
    const handleToggleSaveAsTemplate = () => {
        setSavingAsTemplate(!savingAsTemplate);
        if (!savingAsTemplate) {
            setTemplateName('My Email Template'); // Default name when saving direct email
        }
    };

    // Handle template save
    const handleSaveTemplate = async () => {
        if (!templateName || !emailSubject || !emailBody) {
            return toast.error('Template name, subject, and body are required.');
        }
        
        try {
            const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const templateData = {
                name: templateName,
                subject: emailSubject,
                body: emailBody
            };
            
            let response;
            if (selectedTemplate && !selectedTemplate.isSample) {
                // Update existing template
                response = await axios.put(`/api/email/templates/${selectedTemplate._id}`, templateData, config);
                
                // Update templates array
                setTemplates(templates.map(t => 
                    t._id === selectedTemplate._id ? response.data : t
                ));
                
                toast.success('Template updated successfully!');
            } else {
                // Create new template
                response = await axios.post('/api/email/templates', templateData, config);
                
                // Add to templates array
                setTemplates([response.data, ...templates]);
                
                toast.success('New template created!');
            }
            
            // Set the new/updated template as selected
            setSelectedTemplate(response.data);
            setIsEditingTemplate(false);
            setSavingAsTemplate(false);
            
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template: ' + (error.response?.data?.message || error.message));
        }
    };

    // Handle template delete
    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }
        
        try {
            const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/email/templates/${templateId}`, config);
            
            // Update templates state
            setTemplates(templates.filter(t => t._id !== templateId));
            
            if (selectedTemplate && selectedTemplate._id === templateId) {
                setSelectedTemplate(null);
                setEmailSubject('');
                setEmailBody('');
                setTemplateName('');
            }
            
            toast.success('Template deleted successfully!');
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template: ' + (error.response?.data?.message || error.message));
        }
    };

    // Handle select all users
    const handleSelectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user._id));
        }
    };

    // Handle individual user selection
    const handleUserSelect = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    // Modify handleSendEmail to guide through the workflow
    const handleProceedToRecipients = () => {
        if (!emailSubject || !emailBody) {
            toast.error('Please enter both subject and body before proceeding.');
            return;
        }
        
        setActiveTab('recipients');
        setWorkflowStep('recipients');
    };

    // Update the send email function
    const handleSendEmail = async () => {
        if (!emailSubject || !emailBody) {
            return toast.error('Subject and body are required.');
        }
        
        if (selectedUsers.length === 0) {
            return toast.error('Please select at least one recipient.');
        }
        
        setSendingEmail(true);
        
        try {
            const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const emailData = {
                subject: emailSubject,
                body: emailBody,
                recipients: selectedUsers,
                // Include template name if a template is selected
                templateName: selectedTemplate ? selectedTemplate.name : 'Custom Email'
            };
            
            console.log('Sending email with data:', emailData);
            
            const response = await axios.post('/api/email/send', emailData, config);
            console.log('Email sent response:', response.data);
            
            if (response.data.success) {
                // Display successful email message with more details
                toast.success(`Email sent successfully to ${selectedUsers.length} recipients!`);
                
                // If we have messageIds, show a more detailed success message
                if (response.data.messageIds && response.data.messageIds.length > 0) {
                    toast.info('Email delivery has been initiated. Emails should arrive shortly.');
                }
                
                // After successful sending, reset workflow
                setActiveTab('templates');
                setWorkflowStep('template');
                setSelectedTemplate(null);
                setEmailSubject('');
                setEmailBody('');
                setSelectedUsers([]);
                
                // If the user is on the sent mails tab, refresh the history
                if (activeTab === 'sent') {
                    fetchSentMails();
                }
            } else if (response.data.demo) {
                // Add more helpful information for demo mode
                toast.info(`DEMO MODE: Email would be sent to ${selectedUsers.length} recipients`);
                toast.info('To send actual emails, configure your email credentials in .env file');
                
                // Show configuration instructions
                toast.info('Open the server console for email configuration instructions');
                console.info(`
=== EMAIL CONFIGURATION INSTRUCTIONS ===
To enable actual email sending, add these variables to your .env file:

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

For Gmail:
1. Enable 2-step verification on your Google account
2. Generate an "App Password" for your application
3. Use that App Password in the EMAIL_PASSWORD field
                `);
                
                // For demo mode, add the email to the history
                const newSentMail = {
                    _id: `demo${Date.now()}`,
                    subject: emailSubject,
                    template: selectedTemplate ? selectedTemplate.name : 'Custom Email',
                    recipientCount: selectedUsers.length,
                    sentAt: new Date().toISOString(),
                    status: 'Demo'
                };
                setSentMails(prevMails => [newSentMail, ...prevMails]);
            } else {
                toast.warning('Email status unknown. Check server logs for details.');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            
            // Show more detailed error message
            if (error.response?.data?.message) {
                toast.error(`Failed to send email: ${error.response.data.message}`);
                
                // If there's an SMTP or authentication error, provide guidance
                if (error.response.data.message.includes('authentication') || 
                    error.response.data.message.includes('EAUTH')) {
                    toast.info('Check your email service credentials in the .env file');
                }
            } else {
                toast.error('Failed to send email: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setSendingEmail(false);
        }
    };

    // Add function to fetch sent mail history
    const fetchSentMails = async () => {
        setSentMailsLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const response = await axios.get('/api/email/history', config);
            setSentMails(response.data || []);
        } catch (error) {
            console.error('Failed to fetch email history:', error);
            // Remove sample data fallback
            setSentMails([]);
            toast.error('Failed to load email history.');
        } finally {
            setSentMailsLoading(false);
        }
    };
    
    // Load sent mails when the tab is selected
    useEffect(() => {
        if (activeTab === 'sent') {
            fetchSentMails();
        }
    }, [activeTab]);

    // Rich text editor modules and formats
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    };

    // Format date for display
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Render HTML safely for preview
    const createMarkup = (html) => {
        return { __html: html };
    };

    return (
        <>
            <Meta title="Promotional Emails | Admin" noIndex={true} />
            <div className="promotional-mail-page">
                <div className="page-header">
                    <h1>Promotional Emails</h1>
                    <p className="subtitle">Create and send marketing emails to your customers</p>
                </div>
                
                <div className="promotional-tabs">
                    <button 
                        className={activeTab === 'templates' ? 'active' : ''} 
                        onClick={() => setActiveTab('templates')}
                    >
                        Templates
                    </button>
                    <button 
                        className={activeTab === 'write' ? 'active' : ''} 
                        onClick={() => setActiveTab('write')}
                    >
                        Write Email
                    </button>
                    <button 
                        className={activeTab === 'recipients' ? 'active' : ''} 
                        onClick={() => setActiveTab('recipients')}
                    >
                        Choose Recipients
                    </button>
                    <button 
                        className={activeTab === 'sent' ? 'active' : ''} 
                        onClick={() => setActiveTab('sent')}
                    >
                        Sent Mail
                    </button>
                </div>
                
                <div className="promotional-content">
                    {activeTab === 'templates' && (
                        <div className="templates-container">
                            <div className="templates-header">
                                <h2>Email Templates</h2>
                                <button className="add-template-btn" onClick={handleNewTemplate}>
                                    + Create New Template
                                </button>
                            </div>
                            
                            {loading ? (
                                <p>Loading templates...</p>
                            ) : templates.length === 0 ? (
                                <p>No templates found. Create your first template!</p>
                            ) : (
                                <div className="templates-list">
                                    {templates.map(template => (
                                        <div 
                                            key={template._id} 
                                            className={`template-item ${selectedTemplate && selectedTemplate._id === template._id ? 'selected' : ''}`}
                                            onClick={() => handleTemplateSelect(template)}
                                        >
                                            <div className="template-info">
                                                <h3>{template.name}</h3>
                                                <p>{template.subject}</p>
                                            </div>
                                            <div className="template-actions">
                                                <button title="Edit Template" onClick={(e) => { e.stopPropagation(); handleTemplateSelect(template); handleEditTemplate(); }}>
                                                    <FiEdit />
                                                </button>
                                                <button title="Delete Template" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template._id); }}>
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Add Use Template button when a template is selected */}
                            {selectedTemplate && (
                                <div className="template-use-actions">
                                    <button 
                                        className="use-template-btn" 
                                        onClick={handleUseTemplate}
                                    >
                                        Use This Template
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'write' && (
                        <div className="email-composer">
                            <div className="composer-header">
                                <h2>{isEditingTemplate ? (selectedTemplate ? 'Edit Template' : 'Create New Template') : 'Compose Email'}</h2>
                                {isEditingTemplate ? (
                                    <div className="template-actions">
                                        <button className="save-template-btn" onClick={handleSaveTemplate}>
                                            <FiCheck /> Save Template
                                        </button>
                                        <button className="cancel-btn" onClick={() => {
                                            setIsEditingTemplate(false);
                                            setSavingAsTemplate(false);
                                        }}>
                                            <FiX /> Cancel
                                        </button>
                                    </div>
                                ) : !selectedTemplate && (
                                    <div className="template-actions">
                                        <button 
                                            className="save-as-template-btn" 
                                            onClick={handleToggleSaveAsTemplate}
                                        >
                                            <FiSave /> {savingAsTemplate ? 'Cancel Save' : 'Save as Template'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {(isEditingTemplate || savingAsTemplate) && (
                                <div className="form-group">
                                    <label>Template Name</label>
                                    <input 
                                        type="text" 
                                        value={templateName} 
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="Enter template name"
                                        className="template-name-input"
                                    />
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label>Subject</label>
                                <input 
                                    type="text" 
                                    value={emailSubject} 
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Enter email subject"
                                    className="email-subject-input"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Body</label>
                                <div className="rich-text-editor">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={emailBody} 
                                        onChange={setEmailBody}
                                        modules={modules}
                                        placeholder="Compose your email body here..."
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="template-hint">
                                <h4>Personalization Tags:</h4>
                                <p>Use <code>{'{'}{'{'}'name'{'}'}{'}}'}</code> to insert recipient's name</p>
                                <p>Use <code>{'{'}{'{'}'email'{'}'}{'}}'}</code> to insert recipient's email</p>
                            </div>
                            
                            {!isEditingTemplate && selectedTemplate && (
                                <div className="selected-template-info">
                                    <p>Using template: <strong>{selectedTemplate.name}</strong></p>
                                    <div className="template-actions">
                                        <button className="edit-btn" onClick={handleEditTemplate}>
                                            <FiEdit /> Edit Template
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Add new action buttons for the compose step */}
                            <div className="composer-actions">
                                {savingAsTemplate && (
                                    <button 
                                        className="save-template-btn" 
                                        onClick={handleSaveTemplate}
                                        disabled={!templateName || !emailSubject || !emailBody}
                                    >
                                        <FiSave /> Save Template
                                    </button>
                                )}
                                
                                {!isEditingTemplate && (
                                    <button 
                                        className="next-step-btn" 
                                        onClick={handleProceedToRecipients}
                                        disabled={!emailSubject || !emailBody}
                                    >
                                        Select Recipients <FiArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'recipients' && (
                        <div className="recipients-container">
                            <div className="recipients-header">
                                <h2>Select Recipients</h2>
                                <div className="recipient-stats">
                                    <p>{selectedUsers.length} of {users.length} users selected</p>
                                    <button className="select-all-btn" onClick={handleSelectAllUsers}>
                                        {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Enhanced email preview - show full body */}
                            <div className="email-preview">
                                <div className="email-preview-header">
                                    <h3>Email Preview</h3>
                                    <p><strong>Subject:</strong> {emailSubject}</p>
                                </div>
                                <div className="email-preview-body">
                                    <div dangerouslySetInnerHTML={createMarkup(emailBody)} />
                                </div>
                            </div>
                            
                            {loading ? (
                                <p>Loading users...</p>
                            ) : users.length === 0 ? (
                                <p>No users found.</p>
                            ) : (
                                <div className="users-list">
                                    {users.map(user => (
                                        <div key={user._id} className="user-item">
                                            <label className="user-checkbox">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user._id)}
                                                    onChange={() => handleUserSelect(user._id)}
                                                />
                                                <div className="user-details">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-email">{user.email}</span>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="send-email-section">
                                <button 
                                    className="back-to-compose-btn"
                                    onClick={() => setActiveTab('write')}
                                >
                                    Back to Compose
                                </button>
                                <button 
                                    className="send-email-btn"
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail || selectedUsers.length === 0 || !emailSubject || !emailBody}
                                >
                                    {sendingEmail ? 'Sending...' : (
                                        <>
                                            <FiMail /> Send Email to {selectedUsers.length} Recipients
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'sent' && (
                        <div className="sent-mail-container">
                            <div className="sent-mail-header">
                                <h2>Email Sending History</h2>
                            </div>
                            
                            {sentMailsLoading ? (
                                <p>Loading sent emails...</p>
                            ) : sentMails.length === 0 ? (
                                <div className="no-sent-mails">
                                    <p>No emails have been sent yet. Create and send an email to see history here.</p>
                                </div>
                            ) : (
                                <div className="sent-mails-list">
                                    <table className="sent-mails-table">
                                        <thead>
                                            <tr>
                                                <th>Date & Time</th>
                                                <th>Subject</th>
                                                <th>Template</th>
                                                <th>Recipients</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sentMails.map(mail => (
                                                <tr key={mail._id}>
                                                    <td>{formatDateTime(mail.sentAt)}</td>
                                                    <td>{mail.subject}</td>
                                                    <td>{mail.template}</td>
                                                    <td>{mail.recipientCount}</td>
                                                    <td>
                                                        <span className={`mail-status status-${mail.status.toLowerCase()}`}>
                                                            {mail.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminPromotionalMailPage;