import React, { useState, useEffect } from "react";
import { FaFolder, FaFileUpload } from "react-icons/fa";
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, IconButton } from "@mui/material";
import { Home, Groups, MenuBook, Bookmark, Comment, GroupAdd } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Cookies from 'js-cookie';

const FileView = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [files, setFiles] = useState([]);

  const backendURL = "http://localhost:8000"

  useEffect(() => {
    // Fetch registered courses from the backend
    const fetchRegisteredCourses = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get(`${backendURL}/api/v1/courses/all`, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        setRegisteredCourses(response.data);
      } catch (error) {
        console.error("Error fetching registered courses:", error);
      }
    };

    fetchRegisteredCourses();
  }, []);

  const handleCourseClick = (courseId) => {
    navigate(`/course-files/${courseId}`);
  };

  const filteredFolders = registeredCourses.filter(course =>
    course.name.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Logo */}
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg,rgba(187, 207, 239, 0.75) 0%,rgba(134, 168, 240, 0) 100%)'
        }}>
          <img
            src="src/assets/image.png"
            alt="Logo"
            style={{ width: 180, height: 'auto' }}
          />
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
        {/* Navigation Items */}
        <List>
          <ListItem button onClick={() => navigate('/feed')} sx={{
            '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' }
          }}>
            <ListItemIcon sx={{ color: 'white' }}><Home /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button onClick={() => navigate('/feed')} sx={{
            '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' }
          }}>
            <ListItemIcon sx={{ color: 'white' }}><Comment /></ListItemIcon>
            <ListItemText primary="Community Posts" />
          </ListItem>
          <ListItem button sx={{
            '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' }
          }}>
            <ListItemIcon sx={{ color: 'white' }}><Groups /></ListItemIcon>
            <ListItemText primary="Communities" />
          </ListItem>
          <ListItem button sx={{
            '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' }
          }}>
            <ListItemIcon sx={{ color: 'white' }}><MenuBook /></ListItemIcon>
            <ListItemText primary="Study Materials" />
          </ListItem>
          <ListItem button sx={{
            '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' }
          }}>
            <ListItemIcon sx={{ color: 'white' }}><Bookmark /></ListItemIcon>
            <ListItemText primary="Saved" />
          </ListItem>
          <ListItem
            button
            onClick={() => navigate('/your-clubs')}
            sx={{
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}><GroupAdd /></ListItemIcon>
            <ListItemText primary="Clubs" />
          </ListItem>
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, bgcolor: '#ffffff', color: 'text.primary' }}>
        <Box sx={{ p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #3B82F6, #2563EB)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            Study Resources
          </Typography>
          <IconButton color="primary" aria-label="upload" onClick={() => navigate('/fileUpload')}>
            <FaFileUpload />
          </IconButton>
        </Box>
        <Box sx={{ p: 4 }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {filteredFolders.map((course) => (
              <div
                key={course.id}
                className="relative group bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-100"
                onClick={() => handleCourseClick(course.id)}
              >
                <FaFolder className="text-blue-500 text-6xl transition-all duration-300 group-hover:text-blue-600" />
                <p className="mt-2 text-lg font-semibold text-center text-gray-700">{course.name}</p>
                <p className="text-sm text-gray-500">{course.course_code}</p>
              </div>
            ))}
          </div>
        </Box>
      </Box>
    </div>
  );
};

export default FileView;
