import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import { FaFileAlt, FaDownload, FaUpload } from 'react-icons/fa';
import { Home, Groups, MenuBook, Bookmark, Comment, GroupAdd } from "@mui/icons-material";
import axios from 'axios';

const CourseFiles = () => {
  const { courseId } = useParams();
  const [files, setFiles] = useState([]);
  const [courseName, setCourseName] = useState('');
  const navigate = useNavigate();
  const backendURL = "http://localhost:8000";

  useEffect(() => {
    const fetchCourseFiles = async () => {
      try {
        const filesResponse = await axios.get(`${backendURL}/api/v1/files/course/${courseId}`, {
          withCredentials: true
        });
        console.log(filesResponse.data);
        const courseResponse = await axios.get(`${backendURL}/api/v1/courses/all`, {
          withCredentials: true
        });

        const course = courseResponse.data.find(c => c.id === courseId);
        setCourseName(course?.name || 'Course');
        setFiles(filesResponse.data);
      } catch (error) {
        console.error("Error fetching course files:", error);
      }
    };

    fetchCourseFiles();
  }, [courseId]);

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "auto", display: "flex" }}>
      {/* Sidebar */}
      <Box sx={{
        width: 240,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        background: 'linear-gradient(180deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        height: '100vh'
      }}>
        {/* Copy the sidebar from FileView component */}
        {/* ...existing sidebar code... */}
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, bgcolor: '#ffffff' }}>
        <Box sx={{
          p: 4,
          mb: 3,
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h4" sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #3B82F6, #2563EB)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            {courseName} Files
          </Typography>
          <IconButton
            color="primary"
            onClick={() => navigate('/fileUpload', { state: { courseId } })}
            sx={{
              backgroundColor: '#3B82F6',
              color: 'white',
              '&:hover': {
                backgroundColor: '#2563EB',
              }
            }}
          >
            <FaUpload />
          </IconButton>
        </Box>

        <Box sx={{ p: 4 }}>
          {files.length === 0 ? (
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'gray' }}>
              No files uploaded yet
            </Typography>
          ) : (
            <List>
              {files.map((file) => (
                <ListItem
                  key={file.id}
                  sx={{
                    mb: 2,
                    p: 3,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                      bgcolor: '#f8fafc'
                    }
                  }}
                >
                  <FaFileAlt style={{ marginRight: '16px', color: '#3B82F6' }} />
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ color: '#1e293b', fontSize: '1.1rem' }}>
                        {file.file_name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Uploaded on: {new Date(file.uploaded_at).toLocaleDateString()}
                      </Typography>
                    }
                  />
                  <IconButton
                    onClick={() => handleDownload(file.file_url)}
                    sx={{
                      color: '#3B82F6',
                      '&:hover': {
                        color: '#2563EB',
                      }
                    }}
                  >
                    <FaDownload />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default CourseFiles;
