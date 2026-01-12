import React, { useState } from 'react';
import { FiX, FiDownload, FiUpload, FiAlertCircle, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import Papa from 'papaparse';
import '../AddressModal.css';
import './BulkImportModal.css';

const BulkImportModal = ({ isOpen, onClose, onImport }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [editingCell, setEditingCell] = useState(null);

    if (!isOpen) return null;

    const validateRow = (row, index) => {
        const errors = [];
        
        if (!row.name || !row.name.trim()) {
            errors.push('Name is required');
        }
        
        if (!row.price || isNaN(parseFloat(row.price))) {
            errors.push('Valid price is required');
        }
        
        if (!row.category || !row.category.trim()) {
            errors.push('Category is required');
        }
        
        if (row.discount && (isNaN(parseFloat(row.discount)) || parseFloat(row.discount) < 0 || parseFloat(row.discount) > 100)) {
            errors.push('Discount must be between 0-100');
        }
        
        if (row.stock && (isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0)) {
            errors.push('Stock must be a positive number');
        }

        if (row.status && !['Published', 'Draft', 'Hidden'].includes(row.status)) {
            errors.push('Status must be Published, Draft, or Hidden');
        }
        
        return errors;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
            parseCSV(file);
        } else {
            alert('Please select a valid CSV file');
        }
    };

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data.map((row, index) => ({
                    ...row,
                    _rowIndex: index
                }));
                setPreviewData(data);
                
                // Validate all rows
                const errors = {};
                data.forEach((row, index) => {
                    const rowErrors = validateRow(row, index);
                    if (rowErrors.length > 0) {
                        errors[index] = rowErrors;
                    }
                });
                setValidationErrors(errors);
            },
            error: (error) => {
                alert('Error parsing CSV: ' + error.message);
            }
        });
    };

    const handleCellEdit = (rowIndex, field, value) => {
        const updatedData = [...previewData];
        updatedData[rowIndex][field] = value;
        setPreviewData(updatedData);
        
        // Re-validate the row
        const rowErrors = validateRow(updatedData[rowIndex], rowIndex);
        const newErrors = { ...validationErrors };
        
        if (rowErrors.length > 0) {
            newErrors[rowIndex] = rowErrors;
        } else {
            delete newErrors[rowIndex];
        }
        
        setValidationErrors(newErrors);
    };

    const handleImport = async () => {
        // Check if there are any validation errors
        if (Object.keys(validationErrors).length > 0) {
            alert('Please fix all validation errors before importing');
            return;
        }

        if (previewData.length === 0) {
            alert('No data to import');
            return;
        }
        
        setIsProcessing(true);
        try {
            // Convert preview data back to CSV
            const csv = Papa.unparse(previewData.map(row => {
                const { _rowIndex, ...cleanRow } = row;
                return cleanRow;
            }));
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const file = new File([blob], csvFile.name, { type: 'text/csv' });
            
            await onImport(file);
            
            // Reset state
            setCsvFile(null);
            setPreviewData([]);
            setValidationErrors({});
            setEditingCell(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const removeRow = (rowIndex) => {
        const updatedData = previewData.filter((_, index) => index !== rowIndex);
        setPreviewData(updatedData);
        
        // Update validation errors
        const newErrors = {};
        Object.keys(validationErrors).forEach(key => {
            const errorIndex = parseInt(key);
            if (errorIndex < rowIndex) {
                newErrors[errorIndex] = validationErrors[errorIndex];
            } else if (errorIndex > rowIndex) {
                newErrors[errorIndex - 1] = validationErrors[errorIndex];
            }
        });
        setValidationErrors(newErrors);
    };

    const downloadSample = () => {
        const sampleData = `name,description,category,subcategory,stock,brand,color,tags,shippingInfo,status,price,discount,specifications,photo,additional photo
"iPhone 15 Pro","Latest iPhone with A17 Pro chip, titanium design, and advanced camera system","Electronics","Mobile Phones",50,"Apple","Natural Titanium","iphone,apple,smartphone,premium","Free delivery in 2-3 days","Published",89999,10,"Color:Natural Titanium|Storage:128GB|RAM:8GB|Display:6.1 Super Retina XDR","https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300","https://images.unsplash.com/photo-1596558450268-9c27524ba856?w=300,https://images.unsplash.com/photo-1567581935884-3349723552ca?w=300"
"Canon EOS R6 Mark II","Full-frame mirrorless camera for photography enthusiasts","Electronics","Camera",12,"Canon","Black","camera,canon,mirrorless,photography,professional","Free delivery in 5-7 days","Published",199999,10,"Color:Black|Type:Mirrorless|Sensor:24.2MP Full-frame|Video:4K 60p|Mount:RF","https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300","https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300,https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300"`;
        
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-products.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const getColumns = () => {
        if (previewData.length === 0) return [];
        const firstRow = previewData[0];
        return Object.keys(firstRow).filter(key => key !== '_rowIndex');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content bulk-import-modal-large">
                <button className="modal-close-btn" onClick={onClose}>
                    <FiX />
                </button>
                
                <h2>Bulk Import Products</h2>
                
                <div className="bulk-import-content">
                    {previewData.length === 0 ? (
                        <>
                            <div className="import-instructions">
                                <h3>Instructions:</h3>
                                <ul>
                                    <li>Download the sample CSV file to see the required format</li>
                                    <li>Required fields: name, price, category</li>
                                    <li>Use pipe (|) to separate multiple specifications (e.g., "Color:Red|Size:Large")</li>
                                    <li>Use comma to separate multiple tags, additional photo URLs and subcategories</li>
                                    <li>Category must match existing category names exactly</li>
                                </ul>
                            </div>

                            <div className="sample-download">
                                <span className="sample-download-text">Download Sample Format:</span>
                                <button 
                                    className="download-button" 
                                    onClick={downloadSample}
                                >
                                    <FiDownload /> SampleProducts.CSV
                                </button>
                            </div>

                            <div className="file-upload-section">
                                <label htmlFor="csv-file" className="file-upload-label">
                                    <FiUpload />
                                    Choose CSV File
                                </label>
                                <input
                                    id="csv-file"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="csv-preview-container">
                            <div className="preview-header">
                                <div className="preview-stats">
                                    <h3>Preview Data ({previewData.length} rows)</h3>
                                    {Object.keys(validationErrors).length > 0 && (
                                        <span className="error-badge">
                                            <FiAlertCircle /> {Object.keys(validationErrors).length} rows with errors
                                        </span>
                                    )}
                                    {Object.keys(validationErrors).length === 0 && (
                                        <span className="success-badge">
                                            <FiCheckCircle /> All rows valid
                                        </span>
                                    )}
                                </div>
                                <button 
                                    className="change-file-btn"
                                    onClick={() => {
                                        setCsvFile(null);
                                        setPreviewData([]);
                                        setValidationErrors({});
                                        setEditingCell(null);
                                    }}
                                >
                                    <FiUpload /> Change File
                                </button>
                            </div>

                            <div className="table-wrapper">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            {getColumns().map(col => (
                                                <th key={col}>{col}</th>
                                            ))}
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, rowIndex) => {
                                            const hasError = validationErrors[rowIndex];
                                            return (
                                                <tr key={rowIndex} className={hasError ? 'error-row' : ''}>
                                                    <td className="row-number">{rowIndex + 1}</td>
                                                    {getColumns().map(col => (
                                                        <td 
                                                            key={col}
                                                            className={`editable-cell ${editingCell?.row === rowIndex && editingCell?.col === col ? 'editing' : ''}`}
                                                            onClick={() => setEditingCell({ row: rowIndex, col })}
                                                        >
                                                            {editingCell?.row === rowIndex && editingCell?.col === col ? (
                                                                <input
                                                                    type="text"
                                                                    value={row[col] || ''}
                                                                    onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)}
                                                                    onBlur={() => setEditingCell(null)}
                                                                    autoFocus
                                                                    className="cell-input"
                                                                />
                                                            ) : (
                                                                <span className="cell-content">
                                                                    {row[col] || '-'}
                                                                    <FiEdit2 className="edit-icon" />
                                                                </span>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td>
                                                        {hasError ? (
                                                            <div className="error-cell">
                                                                <FiAlertCircle />
                                                                <div className="error-tooltip">
                                                                    {validationErrors[rowIndex].map((err, i) => (
                                                                        <div key={i}>{err}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <FiCheckCircle className="success-icon" />
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="remove-row-btn"
                                                            onClick={() => removeRow(rowIndex)}
                                                            title="Remove row"
                                                        >
                                                            <FiX />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button 
                            className="auth-button secondary" 
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        {previewData.length > 0 && (
                            <button 
                                className="auth-button" 
                                onClick={handleImport}
                                disabled={Object.keys(validationErrors).length > 0 || isProcessing}
                            >
                                {isProcessing ? 'Processing...' : `Import ${previewData.length} Products`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
