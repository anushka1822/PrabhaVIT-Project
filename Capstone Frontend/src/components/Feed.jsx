import { useState, useEffect } from "react";
import { GroupAdd, AccountCircle } from '@mui/icons-material';
import { AppBar, Toolbar, Typography, Button, Card, CardContent, CardActions, IconButton, TextField, Modal, Box, Grid, Avatar, List, ListItem, ListItemText, Divider, Collapse, ListItemIcon } from "@mui/material";
import { ThumbUp, Comment, Close, Home, TrendingUp, Groups, AddCircle, Bookmark, Report, ExpandMore, MenuBook, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function PostsWindow(){
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newPost, setNewPost] = useState({
        title: "",
        content: ""
    });
    const [newComment, setNewComment] = useState("");
    const [error, setError] = useState(null);
    const [activeCommentForm, setActiveCommentForm] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        fetchPosts();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/v1/users/me", { 
                withCredentials: true 
            });
            setCurrentUserId(response.data.id);
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('access_token');

            // Set token in cookie
            document.cookie = `access_token=${token}; path=/; max-age=3600; samesite=lax;`;

            const response = await axios.get("http://localhost:8000/api/v1/posts/all", { withCredentials: true });
            console.log("Token being sent:", token);
            const postsWithComments = await Promise.all(
                response.data.map(async (post) => {
                    console.log(post)
                    const commentsResponse = await axios.get(
                        `http://localhost:8000/api/v1/posts/comments/${post.id}`, { withCredentials: true }
                    );
                    return { ...post, comments: commentsResponse.data };
                })
            );
            console.log("Processed Posts with Comments:", postsWithComments);
            setPosts(postsWithComments);
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Error fetching posts");
            setShowErrorModal(true);
            console.error("Error fetching posts:", error);
        }
    };

    const addPost = async () => {
        try {
            const token = document.cookie.split('access_token=')[1]?.split(';')[0];
            await axios.post("http://localhost:8000/api/v1/posts/create",
                newPost,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true
                }
            );
            setNewPost({ title: "", content: "" });
            setShowModal(false);
            await fetchPosts();
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Error creating post");
            setShowErrorModal(true);
            console.error("Error creating post:", error);
        }
    };

    const addComment = async (postId) => {
        try {
            const token = document.cookie.split('access_token=')[1]?.split(';')[0];
            await axios.post("http://localhost:8000/api/v1/comment/create",
                {
                    post_id: postId,
                    content: newComment
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true
                }
            );
            setNewComment("");
            await fetchPosts();
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Error adding comment");
            setShowErrorModal(true);
            console.error("Error adding comment:", error);
        }
    };

    const deletePost = async (postId) => {
        try {
            const token = document.cookie.split('access_token=')[1]?.split(';')[0];
            await axios.get(`http://localhost:8000/api/v1/posts/delete/${postId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });
            await fetchPosts();
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Error deleting post");
            setShowErrorModal(true);
            console.error("Error deleting post:", error);
        }
    };

    const deleteComment = async (postId, commentId) => {
        try {
            const token = document.cookie.split('access_token=')[1]?.split(';')[0];
            await axios.get(`http://localhost:8000/api/v1/comment/delete/${commentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });
            await fetchPosts();
        } catch (error) {
            setErrorMessage(error.response?.data?.detail || "Error deleting comment");
            setShowErrorModal(true);
            console.error("Error deleting comment:", error);
        }
    };

    const toggleCommentForm = (postId) => {
        setActiveCommentForm(activeCommentForm === postId ? null : postId);
    };

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "auto", display: "flex" }}>
            {/* Sidebar */}
            <Box sx={{
                width: 240,
                flexShrink: 0,
                borderRight: 1,
                borderColor: 'divider',
                background: 'linear-gradient(180deg, #1976d2 0%, #0d47a1 100%)', // Updated to match FileView
                color: 'white',
                height: '100vh'
            }}>
                {/* Logo */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(180deg,rgba(187, 207, 239, 0.75) 0%,rgba(134, 168, 240, 0) 100%)', // Light blue gradient
                }}>
                    <img
                        src="src/assets/image.png"
                        alt="Logo"
                        style={{ width: 180, height: 'auto' }}  // Increased from 150 to 180
                    />
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />


                {/* Navigation Items */}
                <List>
                    {/* These are the list items at the left side of the page. */}
                    <ListItem 
                        button 
                        onClick={() => currentUserId && navigate(`/profile/${currentUserId}`)}
                        sx={{
                            '&:hover': {
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                transition: 'all 0.3s ease'
                            }
                        }}
                        className="sidebar-item">
                        <ListItemIcon><AccountCircle className="sidebar-icon" /></ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItem>

                    <ListItem button sx={{ '&:hover': { background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', transition: 'all 0.3s ease' } }}>
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

            {/* Main Content with Header */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Static Header */}
                <Box sx={{
                    position: 'sticky',
                    top: 0,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h4" sx={{
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #3B82F6, #2563EB)', // Changed to light blue
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                    }}>
                        Community Posts
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddCircle />}
                        onClick={() => setShowModal(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #3B82F6, #2563EB)', // Changed to light blue
                            '&:hover': {
                                background: 'linear-gradient(45deg, #2563EB, #1D4ED8)' // Darker blue on hover
                            }
                        }}
                    >
                        Create Post
                    </Button>
                </Box>

                {/* Updated Posts Section */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            {posts.map((post) => (
                                <Card key={post.id} sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    p: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    position: 'relative',
                                    '&:hover .post-delete': {
                                        opacity: 1,
                                    }
                                }}>
                                    {/* Post Delete Button */}
                                    <IconButton
                                        className="post-delete"
                                        color="error"
                                        onClick={() => deletePost(post.id)}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            opacity: 0,
                                            transition: 'opacity 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                            }
                                        }}
                                    >
                                        <Delete />
                                    </IconButton>

                                    <Grid container alignItems="center" spacing={1}>
                                        <Grid item>
                                            <Avatar>{post.user_id?.charAt(0)}</Avatar>
                                        </Grid>
                                        <Grid item xs>
                                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                                {post.user_id}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    {/* Full content always visible */}
                                    <Typography variant="h5" sx={{
                                        fontWeight: "bold",
                                        mt: 2,
                                        color: '#1976d2'
                                    }}>
                                        {post.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        mt: 1,
                                        mb: 2,
                                        lineHeight: 1.6
                                    }}>
                                        {post.content}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Comments section with toggleable form */}
                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mb: 2
                                        }}>
                                            <Typography variant="subtitle1" sx={{
                                                fontWeight: 'bold',
                                                color: '#666'
                                            }}>
                                                Comments ({post.comments?.length || 0})
                                            </Typography>
                                            <Button
                                                startIcon={<Comment />}
                                                onClick={() => toggleCommentForm(post.id)}
                                                sx={{ color: '#1976d2' }}
                                            >
                                                {activeCommentForm === post.id ? 'Close' : 'Reply'}
                                            </Button>
                                        </Box>

                                        {/* Toggleable comment form */}
                                        {activeCommentForm === post.id && (
                                            <Box sx={{ mb: 2 }}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Add a comment..."
                                                    variant="outlined"
                                                    size="small"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addComment(post.id);
                                                            toggleCommentForm(post.id);
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            </Box>
                                        )}

                                        {/* Always visible comments */}
                                        {post.comments?.map((comment, index) => (
                                            <Box key={index} sx={{
                                                p: 1.5,
                                                borderLeft: '3px solid #1976d2',
                                                mb: 1,
                                                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                                                borderRadius: '0 4px 4px 0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                position: 'relative',
                                                '&:hover .comment-delete': {
                                                    opacity: 1,
                                                }
                                            }}>
                                                <Typography variant="body2" sx={{ pr: 4 }}>
                                                    {comment.content}
                                                </Typography>
                                                <IconButton
                                                    className="comment-delete"
                                                    size="small"
                                                    onClick={() => deleteComment(post.id, comment._id)}
                                                    sx={{
                                                        position: 'absolute',
                                                        right: 8,
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s ease',
                                                        color: 'error.main',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(211, 47, 47, 0.04)'
                                                        }
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                </Card>
                            ))}
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* Create Post Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "background.paper", boxShadow: 24, p: 4, borderRadius: 2 }}>
                    <IconButton sx={{ position: "absolute", top: 8, right: 8 }} onClick={() => setShowModal(false)}>
                        <Close />
                    </IconButton>
                    <Typography variant="h6" gutterBottom>Create a Post</Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Content"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    />
                    <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={addPost}>
                        Post
                    </Button>
                </Box>
            </Modal>

            {/* Error Modal */}
            <Modal open={showErrorModal} onClose={() => setShowErrorModal(false)}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "background.paper", boxShadow: 24, p: 4, borderRadius: 2 }}>
                    <IconButton sx={{ position: "absolute", top: 8, right: 8 }} onClick={() => setShowErrorModal(false)}>
                        <Close />
                    </IconButton>
                    <Typography variant="h6" gutterBottom>Error</Typography>
                    <Typography variant="body1">{errorMessage}</Typography>
                </Box>
            </Modal>
        </div>
    );
}