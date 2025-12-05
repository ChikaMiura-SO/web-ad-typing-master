import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

const ProblemList = ({ onEdit }) => {
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    // Filters
    const [courseFilter, setCourseFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');

    useEffect(() => {
        fetchProblems();
    }, []);

    useEffect(() => {
        filterProblems();
    }, [problems, courseFilter, levelFilter]);

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'problems'));
            const problemData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProblems(problemData);
        } catch (error) {
            console.error("Error fetching problems: ", error);
            alert("Error fetching problems");
        } finally {
            setLoading(false);
        }
    };

    const filterProblems = () => {
        let result = [...problems];
        if (courseFilter !== 'all') {
            result = result.filter(p => p.course_id === courseFilter);
        }
        if (levelFilter !== 'all') {
            // Ensure level comparison handles string/number mismatch if necessary
            result = result.filter(p => String(p.level_id) === String(levelFilter));
        }
        setFilteredProblems(result);
    };

    const handleCheckboxChange = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredProblems.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBatchDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

        try {
            const batch = writeBatch(db);
            selectedIds.forEach(id => {
                const docRef = doc(db, 'problems', id);
                batch.delete(docRef);
            });
            await batch.commit();

            alert('Selected items deleted successfully');
            setSelectedIds([]);
            fetchProblems(); // Refresh list
        } catch (error) {
            console.error("Error deleting documents: ", error);
            alert("Error deleting documents");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await deleteDoc(doc(db, 'problems', id));
            fetchProblems();
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    if (loading) return <div>Loading problems...</div>;

    // Extract unique courses and levels for filter options
    const courses = [...new Set(problems.map(p => p.course_id))].filter(Boolean);
    const levels = [...new Set(problems.map(p => p.level_id))].filter(Boolean).sort();

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ width: '200px' }}>
                    <option value="all">All Courses</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ width: '200px' }}>
                    <option value="all">All Levels</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                {selectedIds.length > 0 && (
                    <button onClick={handleBatchDelete} className="btn btn-danger">
                        Delete Selected ({selectedIds.length})
                    </button>
                )}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                onChange={handleSelectAll}
                                checked={filteredProblems.length > 0 && selectedIds.length === filteredProblems.length}
                            />
                        </th>
                        <th>ID</th>
                        <th>Course</th>
                        <th>Level</th>
                        <th>Term</th>
                        <th>Reading</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProblems.map(problem => (
                        <tr key={problem.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(problem.id)}
                                    onChange={() => handleCheckboxChange(problem.id)}
                                />
                            </td>
                            <td>{problem.question_id}</td>
                            <td>{problem.course_id}</td>
                            <td>{problem.level_id}</td>
                            <td>{problem.question_text}</td>
                            <td>{problem.correct_answer}</td>
                            <td>
                                <button
                                    onClick={() => onEdit(problem)}
                                    className="btn btn-secondary"
                                    style={{ marginRight: '5px', padding: '4px 8px', fontSize: '12px' }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(problem.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredProblems.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center' }}>No problems found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ProblemList;
