import React, { useState } from 'react';
import Papa from 'papaparse';
import { writeBatch, doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const CSVManager = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setLogs([]);
    };

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
    };

    const validateRow = (row, index) => {
        const requiredFields = ['course_id', 'level_id', 'question_id', 'question_text', 'correct_answer'];
        for (const field of requiredFields) {
            if (!row[field]) {
                return `Row ${index + 1}: Missing required field '${field}'`;
            }
        }
        if (row.question_text.includes('http://') || row.question_text.includes('https://')) {
            return `Row ${index + 1}: External links are not allowed in question_text`;
        }
        return null;
    };

    const handleImport = () => {
        if (!file) {
            alert('Please select a CSV file first.');
            return;
        }

        setLoading(true);
        setLogs([]);
        addLog('Starting CSV parsing...');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data;
                addLog(`Parsed ${data.length} rows.`);

                // Validation
                const errors = [];
                const validRows = [];
                const questionIds = new Set();

                data.forEach((row, index) => {
                    const error = validateRow(row, index);
                    if (error) {
                        errors.push(error);
                    } else if (questionIds.has(row.question_id)) {
                        errors.push(`Row ${index + 1}: Duplicate question_id '${row.question_id}' in file`);
                    } else {
                        questionIds.add(row.question_id);
                        validRows.push(row);
                    }
                });

                if (errors.length > 0) {
                    addLog(`Validation failed with ${errors.length} errors:`, 'error');
                    errors.forEach(err => addLog(err, 'error'));
                    setLoading(false);
                    return;
                }

                addLog('Validation passed. Starting batch update...');

                try {
                    // Process in batches of 500 (Firestore limit)
                    const batchSize = 500;
                    for (let i = 0; i < validRows.length; i += batchSize) {
                        const batch = writeBatch(db);
                        const chunk = validRows.slice(i, i + batchSize);

                        chunk.forEach(row => {
                            const docRef = doc(db, 'problems', row.question_id);
                            batch.set(docRef, {
                                ...row,
                                updatedAt: new Date()
                            }, { merge: true });
                        });

                        await batch.commit();
                        addLog(`Processed batch ${i / batchSize + 1} (${chunk.length} items).`);
                    }

                    addLog('Import completed successfully!', 'success');
                    alert('Import completed successfully!');
                } catch (error) {
                    console.error('Import error:', error);
                    addLog(`Import failed: ${error.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            },
            error: (error) => {
                addLog(`CSV Parsing error: ${error.message}`, 'error');
                setLoading(false);
            }
        });
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'problems'));
            const data = querySnapshot.docs.map(doc => doc.data());

            if (data.length === 0) {
                alert('No data to export.');
                return;
            }

            // Define fields order
            const fields = ['course_id', 'level_id', 'question_id', 'question_text', 'correct_answer', 'explanation'];
            const csv = Papa.unparse(data, { columns: fields });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `problems_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addLog(`Exported ${data.length} items.`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            addLog(`Export failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>CSV Import / Export</h3>

            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h4>Import CSV</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Required headers: <code>course_id, level_id, question_id, question_text, correct_answer</code><br />
                    Optional: <code>explanation</code>
                </p>
                <input type="file" accept=".csv" onChange={handleFileChange} disabled={loading} />
                <button onClick={handleImport} className="btn btn-primary" disabled={!file || loading}>
                    {loading ? 'Importing...' : 'Import CSV'}
                </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h4>Export CSV</h4>
                <button onClick={handleExport} className="btn btn-secondary" disabled={loading}>
                    {loading ? 'Exporting...' : 'Export All Data to CSV'}
                </button>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h4>Logs</h4>
                <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb' }}>
                    {logs.length === 0 && <span style={{ color: '#9ca3af' }}>No logs yet.</span>}
                    {logs.map((log, i) => (
                        <div key={i} style={{
                            marginBottom: '4px',
                            color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#374151',
                            fontSize: '0.9rem'
                        }}>
                            [{log.timestamp}] {log.message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CSVManager;
