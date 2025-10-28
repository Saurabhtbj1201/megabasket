import React, { useState } from 'react';
import { FiX, FiDownload, FiUpload } from 'react-icons/fi';
import '../AddressModal.css';

const BulkImportModal = ({ isOpen, onClose, onImport }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            alert('Please select a valid CSV file');
        }
    };

    const handleImport = async () => {
        if (!csvFile) {
            alert('Please select a CSV file');
            return;
        }
        
        setIsProcessing(true);
        try {
            await onImport(csvFile);
        } finally {
            setIsProcessing(false);
            setCsvFile(null);
        }
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

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>
                    <FiX />
                </button>
                
                <h2>Bulk Import Products</h2>
                
                <div className="bulk-import-content">
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
                        {csvFile && (
                            <p className="selected-file">Selected: {csvFile.name}</p>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button 
                            className="auth-button secondary" 
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button 
                            className="auth-button" 
                            onClick={handleImport}
                            disabled={!csvFile || isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Import Products'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
