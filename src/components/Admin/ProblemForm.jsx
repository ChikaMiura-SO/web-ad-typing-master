import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const ProblemForm = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        course_id: 'marketing',
        level_id: '1',
        question_id: '',
        question_text: '',
        correct_answer: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.course_id || !formData.level_id || !formData.question_id || !formData.question_text || !formData.correct_answer) {
            return "All fields are required.";
        }
        if (formData.question_text.includes('http://') || formData.question_text.includes('https://')) {
            return "External links are not allowed in the question text.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Use question_id as the document ID
            const docRef = doc(db, 'problems', formData.question_id);

            // Check for duplicate ID on creation
            if (!initialData) {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    throw new Error(`Problem with ID ${formData.question_id} already exists.`);
                }
            }

            const dataToSave = {
                ...formData,
                updatedAt: new Date()
            };

            if (initialData) {
                // Update existing
                await updateDoc(docRef, dataToSave);
            } else {
                // Create new
                await setDoc(docRef, {
                    ...dataToSave,
                    createdAt: new Date()
                });
            }

            alert('Problem saved successfully!');
            onSuccess();
        } catch (err) {
            console.error("Error saving problem:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>{initialData ? 'Edit Problem' : 'Add New Problem'}</h3>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label>Course ID</label>
                        <select name="course_id" value={formData.course_id} onChange={handleChange} required>
                            <option value="marketing">marketing</option>
                            <option value="compliance">compliance</option>
                        </select>
                    </div>
                    <div>
                        <label>Level ID</label>
                        <select name="level_id" value={formData.level_id} onChange={handleChange} required>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label>Question ID (Unique)</label>
                    <input
                        type="text"
                        name="question_id"
                        value={formData.question_id}
                        onChange={handleChange}
                        disabled={!!initialData} // Disable ID editing for existing items
                        required
                    />
                </div>

                <div>
                    <label>Term (Question Text)</label>
                    <input
                        type="text"
                        name="question_text"
                        value={formData.question_text}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Reading (Correct Answer)</label>
                    <input
                        type="text"
                        name="correct_answer"
                        value={formData.correct_answer}
                        onChange={handleChange}
                        required
                    />
                </div>



                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Problem'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProblemForm;
