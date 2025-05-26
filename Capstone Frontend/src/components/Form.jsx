import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Form.css';

function Form() {
  const [formData, setFormData] = useState({
    studentName: '',
    course: '',
    assignmentFile: null,
    submissionDate: '',
  });

  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate form completion progress dynamically
  useEffect(() => {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter((value) => value).length;
    setProgress((filledFields / totalFields) * 100);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, assignmentFile: e.target.files[0] }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.studentName.trim()) newErrors.studentName = 'Name is required.';
    if (!formData.course.trim()) newErrors.course = 'Course is required.';
    if (!formData.assignmentFile) newErrors.assignmentFile = 'File is required.';
    if (!formData.submissionDate) newErrors.submissionDate = 'Submission date is required.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      // Simulate submission process
      setTimeout(() => {
        alert('Assignment submitted successfully!');
        setFormData({
          studentName: '',
          course: '',
          assignmentFile: null,
          submissionDate: '',
        });
        setErrors({});
        setIsSubmitting(false);
      }, 2000); // Simulated delay for submission
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <motion.div
      className="assignment-form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Assignment Submission</h1>

      {/* Progress Bar Container (Add it here) */}
      <div className="progress-bar-container">
        <motion.div
          className="progress-bar"
          style={{ width: `${progress}%` }} // Dynamic width based on progress
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <form onSubmit={handleSubmit} className="assignment-form">
        <motion.div
          className="form-group"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <label htmlFor="studentName">Student Name</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter your name"
          />
          {errors.studentName && <p className="error">{errors.studentName}</p>}
        </motion.div>

        <motion.div
          className="form-group"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <label htmlFor="course">Course</label>
          <select
            id="course"
            name="course"
            value={formData.course}
            onChange={handleInputChange}
          >
            <option value="">Select a course</option>
            <option value="React JS">React JS</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Deep Learning">Deep Learning</option>
          </select>
          {errors.course && <p className="error">{errors.course}</p>}
        </motion.div>

        <motion.div
          className="form-group"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label htmlFor="assignmentFile">Assignment File</label>
          <input
            type="file"
            id="assignmentFile"
            name="assignmentFile"
            accept=".pdf,.docx,.zip"
            onChange={handleFileChange}
          />
          {errors.assignmentFile && <p className="error">{errors.assignmentFile}</p>}
        </motion.div>

        <motion.div
          className="form-group"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <label htmlFor="submissionDate">Submission Date</label>
          <input
            type="date"
            id="submissionDate"
            name="submissionDate"
            value={formData.submissionDate}
            onChange={handleInputChange}
          />
          {errors.submissionDate && <p className="error">{errors.submissionDate}</p>}
        </motion.div>

        <motion.button
          type="submit"
          className="submit-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default Form;
