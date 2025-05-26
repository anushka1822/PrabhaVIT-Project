// FileUpload.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../styles/FileUpload.css';
import axios from 'axios';

const FileUpload = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadTime, setUploadTime] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = true; // Admin check logic (true for admin, false for user)
  const backendURL = "https://prabhavit-project-backend.onrender.com"

  useEffect(() => {
    // Fetch courses from the backend
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${backendURL}/api/v1/courses/all`);
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // Check if the file is a PDF
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result); // Preview the PDF (you can implement a PDF viewer here)
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert("Only PDF files are allowed!");
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleFileUpload = async () => {
    if (!file || !selectedCourseId || !fileName.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Get file extension from original file
    const originalExt = file.name.split('.').pop();
    const formattedFileName = `${fileName.trim()}.${originalExt}`;

    const formData = new FormData();
    formData.append('file', file); // Use original file
    formData.append('file_name', formattedFileName);
    formData.append('course_id', selectedCourseId);
    formData.append('description', description?.trim() || '');

    try {
      console.log('Starting file upload...', {
        fileName: formattedFileName,
        courseId: selectedCourseId,
        fileType: file.type
      });

      const response = await axios.post(`${backendURL}/api/v1/files/upload`, formData, {
        headers: {
          'Accept': 'application/json',
        },
        withCredentials: true,
      });

      console.log('Upload successful:', response.data);
      setUploadTime(new Date().toLocaleString());
      alert('File uploaded successfully!');
      navigate(`/course-files/${selectedCourseId}`);
    } catch (error) {
      console.error("Upload error details:", error.response?.data);
      const errorMsg = error.response?.data?.detail || "File upload failed. Please try again.";
      alert(errorMsg);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-heading">Upload File</h2>
      {isAdmin ? (
        <>
          <div className="form-group">
            <label htmlFor="course">Select Course:</label>
            <select id="course" value={selectedCourseId} onChange={handleCourseChange} className="course-select theme-select">
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.course_code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="fileName">File Name:</label>
            <input
              type="text"
              id="fileName"
              value={fileName}
              onChange={handleFileNameChange}
              className="file-name-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              className="file-description-input"
            />
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="file-input"
          />
          <div className="file-info">
            {file ? (
              <span className="file-name">{file.name}</span>
            ) : (
              <span className="no-file">No file chosen</span>
            )}
          </div>
          {previewUrl && (
            <div className="pdf-preview">
              <embed src={previewUrl} width="600" height="400" type="application/pdf" />
            </div>
          )}
          <div className="upload-actions">
            <button
              onClick={handleFileUpload}
              disabled={!file || !selectedCourseId}
              className="upload-btn"
            >
              Upload
            </button>
          </div>
          {uploadTime && (
            <div className="upload-time">
              <p>Uploaded on: {uploadTime}</p>
            </div>
          )}
        </>
      ) : (
        <p className="no-access">You are not authorized to upload files.</p>
      )}
    </div>
  );
};

export default FileUpload;
