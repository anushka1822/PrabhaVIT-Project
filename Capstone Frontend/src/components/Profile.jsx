import { useState, useEffect } from "react";
import { GroupAdd, AccountCircle, Edit, CalendarToday, PostAdd, Email, History, Message } from '@mui/icons-material';
import { AppBar, Toolbar, Typography, Button, Card, CardContent, IconButton, Box, Grid, Avatar, List, ListItem, ListItemText, Divider, ListItemIcon, Tabs, Tab, Paper, Chip } from "@mui/material";
import { Home, TrendingUp, Groups, MenuBook, Bookmark } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/profile.css";

export default function ProfilePage() {
    const { user_id } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        username: "",
        email: "",
        joined: "",
        postsCount: 0
    });
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [userPosts, setUserPosts] = useState([]);
    const [userActivity, setUserActivity] = useState([]);
    const [userComments, setUserComments] = useState([]);

    useEffect(() => {
        if (user_id) {
            fetchUserData();
            fetchUserPosts();
            fetchUserComments();
        }
    }, [user_id]);

    const fetchUserPosts = async () => {
        try {
            // Changed: First get user data to get regno
            const userResponse = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/users/${user_id}`,
                { withCredentials: true }
            );
            const regno = userResponse.data.regno;

            // Use regno instead of user_id
            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/users/posts/user/${regno}`,
                { withCredentials: true }
            );
            setUserPosts(response.data);
            console.log("User Posts:", response.data);
            const postActivity = response.data.map(post => ({
                id: post.id,
                type: "post",
                post: post.title,
                date: new Date(post.created_at).toLocaleDateString(),
                content: post.content
            }));
            setUserActivity(postActivity);
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const fetchUserComments = async () => {
        try {
            const userResponse = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/users/${user_id}`,
                { withCredentials: true }
            );
            const regno = userResponse.data.regno;

            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/users/comments/user/${user_id}`,
                { withCredentials: true }
            );
            console.log("Comments response:", response.data); // Debug log

            setUserComments(response.data);

            const commentActivity = response.data.map(comment => ({
                id: comment.id,
                type: "comment",
                post: comment.post_title || "Unknown Post",
                content: comment.content,
                date: new Date(comment.created_at).toLocaleDateString()
            }));

            setUserActivity(prevActivity => {
                // Get only the post activities from previous state
                const postActivities = prevActivity.filter(act => act.type === "post");
                // Combine and sort all activities
                const allActivities = [...postActivities, ...commentActivity];
                return allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
            });
        } catch (error) {
            console.error("Error fetching user comments:", error);
            console.error("Error details:", error.response?.data);
        }
    };

    // Modified fetchUserData to properly handle counts
    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`https://prabhavit-project-backend.onrender.com/api/v1/users/${user_id}`, {
                withCredentials: true
            });

            setUserData({
                username: response.data.name || "User",
                email: response.data.email,
                regno: response.data.regno,
                joined: new Date(response.data.created_at).toLocaleDateString(),
                postsCount: response.data.posts_count,
                commentsCount: response.data.comments_count,
                faculty: "School of Computer Science and Engineering",
                interests: ["Web Development", "AI/ML", "Cloud Computing"],
                clubs_participated: response.data.clubs_participated || [], // Add this line
                clubs_administered: response.data.clubs_administered || [], // Add this line for completeness
            });

            console.log("User data from backend:", response.data); // Debug log
        } catch (error) {
            setError(error.response?.data?.detail || "Error fetching user data");
            console.error("Error fetching user data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "auto", display: "flex" }}>
            {/* Sidebar - Same as Feed */}
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
                    background: 'linear-gradient(180deg,rgba(187, 207, 239, 0.75) 0%,rgba(134, 168, 240, 0) 100%)',
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
                    <ListItem button selected sx={{
                        background: 'rgba(255,255,255,0.15)',
                        '&:hover': {
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)'
                        }
                    }}>
                        <ListItemIcon><AccountCircle /></ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItem>

                    {/* Other navigation items same as Feed */}
                    <ListItem button onClick={() => navigate("/feed")}
                        sx={{ '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' } }}>
                        <ListItemIcon sx={{ color: 'white' }}><Home /></ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItem>

                    <ListItem button sx={{ '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' } }}>
                        <ListItemIcon sx={{ color: 'white' }}><TrendingUp /></ListItemIcon>
                        <ListItemText primary="Trending" />
                    </ListItem>

                    <ListItem button sx={{ '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' } }}>
                        <ListItemIcon sx={{ color: 'white' }}><Groups /></ListItemIcon>
                        <ListItemText primary="Communities" />
                    </ListItem>

                    <ListItem button
                        onClick={() => navigate('/fileview')}
                        sx={{ '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' } }}
                    >
                        <ListItemIcon sx={{ color: 'white' }}><MenuBook /></ListItemIcon>
                        <ListItemText primary="Study Materials" />
                    </ListItem>

                    <ListItem button sx={{ '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' } }}>
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
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    backgroundColor: '#fff',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    p: 2,
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
                        My Profile
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<Edit />}>
                        Edit Profile
                    </Button>
                </Box>

                {/* Profile Content */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto', background: '#f5f7fa' }}>
                    {/* Profile Header */}
                    <Card className="profile-header-card">
                        <CardContent>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item>
                                    <div className="avatar-container">
                                        <Avatar className="profile-avatar">
                                            {userData.username?.charAt(0)}
                                        </Avatar>
                                        <IconButton className="edit-avatar-button">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </div>
                                </Grid>
                                <Grid item xs>
                                    <Typography variant="h4" className="username">
                                        {userData.username}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                                        <Email fontSize="small" color="action" />
                                        <Typography variant="subtitle1" className="email">
                                            {userData.email}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                                        <CalendarToday fontSize="small" color="action" />
                                        <Typography variant="body2" sx={{ color: '#666' }}>
                                            Joined: {userData.joined}
                                        </Typography>
                                    </Box>
                                    {userData.faculty && (
                                        <Box mt={2}>
                                            <Chip label={userData.faculty} color="primary" variant="outlined" />
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box className="stats-container">
                                        <div className="stat-item">
                                            <Typography variant="h5">{userData.postsCount || 0}</Typography>
                                            <Typography variant="body2">Posts</Typography>
                                        </div>
                                        <div className="stat-item">
                                            <Typography variant="h5">{userData.commentsCount || 0}</Typography>
                                            <Typography variant="body2">Comments</Typography>
                                        </div>
                                        <div className="stat-item">
                                            <Typography variant="h5">{userData.clubs_participated?.length || 0}</Typography>
                                            <Typography variant="body2">Clubs</Typography>
                                        </div>
                                    </Box>
                                </Grid>
                            </Grid>

                            {userData.interests && userData.interests.length > 0 && (
                                <Box mt={3}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                                        Interests
                                    </Typography>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {userData.interests.map((interest, index) => (
                                            <Chip
                                                key={index}
                                                label={interest}
                                                size="small"
                                                className="interest-chip"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs Section */}
                    <Box mt={3}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            className="profile-tabs"
                        >
                            <Tab label="Recent Posts" icon={<PostAdd />} iconPosition="start" />
                            <Tab label="Recent Activity" icon={<History />} iconPosition="start" />
                            <Tab label="About" icon={<AccountCircle />} iconPosition="start" />
                        </Tabs>

                        {/* Tab Content */}
                        <Box mt={2}>
                            {/* Recent Posts Tab */}
                            {tabValue === 0 && (
                                <div className="tab-content">
                                    {userPosts.length > 0 ? (
                                        userPosts.map((post) => (
                                            <Paper key={post.id} className="post-item" elevation={1}>
                                                <Typography variant="h6">{post.title}</Typography>
                                                <Typography variant="body2">{post.content}</Typography>
                                                <Box display="flex" justifyContent="space-between" mt={1}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography variant="body2" color="primary">
                                                        {post.comments_count || 0} comments
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        ))
                                    ) : (
                                        <Typography variant="body1" textAlign="center" sx={{ p: 3, color: '#666' }}>
                                            No posts yet
                                        </Typography>
                                    )}
                                </div>
                            )}

                            {/* Recent Activity Tab */}
                            {tabValue === 1 && (
                                <div className="tab-content">
                                    {userActivity.length > 0 ? (
                                        userActivity.map((activity) => (
                                            <Paper key={activity.id} className="activity-item" elevation={1}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {activity.type === "comment" && <Message color="primary" />}
                                                    {activity.type === "post" && <PostAdd color="action" />}
                                                    <Box>
                                                        <Typography variant="body1">
                                                            {activity.type === "comment" ? "Commented on" : "Posted"}
                                                            {" "}
                                                            <span className="highlight-text">{activity.post}</span>
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                            {activity.content}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                                            {activity.date}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        ))
                                    ) : (
                                        <Typography variant="body1" textAlign="center" sx={{ p: 3, color: '#666' }}>
                                            No activity yet
                                        </Typography>
                                    )}
                                </div>
                            )}

                            {/* About Tab */}
                            {tabValue === 2 && (
                                <div className="tab-content">
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Card className="about-card">
                                                <CardContent>
                                                    <Typography variant="h6" className="card-title">
                                                        Account Information
                                                    </Typography>
                                                    <div className="info-item">
                                                        <span>Username</span>
                                                        <span>{userData.username}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span>Registration No.</span>
                                                        <span>{userData.regno}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span>Email</span>
                                                        <span>{userData.email}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span>Member Since</span>
                                                        <span>{userData.joined}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span>Last Login</span>
                                                        <span>{userData.lastLogin}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card className="about-card">
                                                <CardContent>
                                                    <Typography variant="h6" className="card-title">
                                                        Activity Summary
                                                    </Typography>
                                                    <div className="info-item">
                                                        <span>Posts Created</span>
                                                        <span>{userData.postsCount}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span>Comments Made</span>
                                                        <span>{userData.commentsCount}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span>Faculty</span>
                                                        <span>{userData.faculty}</span>
                                                    </div>
                                                    {userData.interests && userData.interests.length > 0 && (
                                                        <div className="info-item">
                                                            <span>Interests</span>
                                                            <span>
                                                                {userData.interests.join(", ")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </div>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </div>
    );
}