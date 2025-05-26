import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Box,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Alert,
    DialogContentText
} from "@mui/material";
import {
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    AdminPanelSettings as AdminIcon,
    ArrowBack as ArrowBackIcon
} from "@mui/icons-material";

const ClubChat = () => {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [posts, setPosts] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [newPost, setNewPost] = useState({ title: "", content: "" });
    const [showPostDialog, setShowPostDialog] = useState(false);
    const [error, setError] = useState("");
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");
    const [openPendingModal, setOpenPendingModal] = useState(false);
    const [openParticipantsModal, setOpenParticipantsModal] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [openAdminsModal, setOpenAdminsModal] = useState(false); // <<-- new state
    const [clubAdmins, setClubAdmins] = useState([]);               // <<-- new state

    useEffect(() => {
        fetchUserInfo();
        fetchPosts();
    }, [clubId]);

    useEffect(() => {
        if (userId) {
            fetchClubDetails();
        }
    }, [userId, clubId]);

    useEffect(() => {
        if (isAdmin) {
            fetchPendingRequests();
        }
    }, [isAdmin, clubId]);

    const fetchUserInfo = async () => {
        try {
            const response = await axios.get("https://prabhavit-project-backend.onrender.com/api/v1/users/me",
                { withCredentials: true }
            );
            setUserId(response.data.id);
        } catch (error) {
            setError("Error fetching user info: " + error.response?.data?.detail || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubDetails = async () => {
        try {
            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/details`,
                { withCredentials: true }
            );
            // Use the already fetched userId to set admin status
            if (userId && response.data.admins) {
                setIsAdmin(response.data.admins.includes(userId));
            }
        } catch (error) {
            console.error("Failed to fetch club details:", error);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/posts`,
                { withCredentials: true }
            );
            setPosts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setError("Failed to load posts: " + error.response?.data?.detail || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/pending`,
                { withCredentials: true }
            );
            setPendingRequests(response.data || []);
        } catch (error) {
            setError("Error fetching pending requests: " + error.response?.data?.detail || error.message);
        }
    };

    const fetchParticipants = async () => {
        try {
            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/participants`,
                { withCredentials: true }
            );
            setParticipants(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setError("Failed to load participants: " + error.response?.data?.detail || error.message);
        }
    };

    const fetchClubAdmins = async () => { // <<-- updated function with debugging
        try {
            const response = await axios.get(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/details`,
                { withCredentials: true }
            );
            console.log("Club details:", response.data); // Debug: log complete details
            const adminIds = response.data.admins || [];
            console.log("Admin IDs:", adminIds); // Debug: log admin IDs
            if (!adminIds.length) {
                setClubAdmins([]);
                return;
            }
            // Assuming an endpoint like GET /users/<adminId> returns user info with property 'name'
            const adminRequests = adminIds.map((adminId) =>
                axios.get(`https://prabhavit-project-backend.onrender.com/api/v1/users/${adminId}`, { withCredentials: true })
            );
            const adminResponses = await Promise.all(adminRequests);
            const adminNames = adminResponses.map((res) => res.data.name);
            setClubAdmins(adminNames);
            console.log("Fetched admin names:", adminNames); // Debug: log fetched names
        } catch (error) {
            console.error("Error fetching club admins:", error);
        }
    };

    const handleCreatePost = async () => {
        try {
            if (!newPost.title || !newPost.content) {
                setError("Please fill in both title and content");
                return;
            }

            await axios.post(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/createpost`,
                newPost,
                { withCredentials: true }
            );
            setShowPostDialog(false);
            setNewPost({ title: "", content: "" });
            setSuccessMessage("Post created successfully");
            fetchPosts();
        } catch (error) {
            setError("Failed to create post: " + error.response?.data?.detail || error.message);
        }
    };

    const handleRequest = async (userId, action) => {
        try {
            await axios.post(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/${action}`,
                { user_id: userId },
                { withCredentials: true }
            );
            setSuccessMessage(`Successfully ${action}ed user`);
            fetchPendingRequests();
        } catch (error) {
            setError(`Error ${action}ing request: ` + error.response?.data?.detail || error.message);
        }
    };

    const makeAdmin = async (userId) => {
        try {
            await axios.post(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/make-admin`,
                { user_id: userId },
                { withCredentials: true }
            );
            setSuccessMessage("Successfully made user an admin");
            fetchPendingRequests();
        } catch (error) {
            setError("Failed to make user an admin: " + error.response?.data?.detail || error.message);
        }
    };

    const handleOpenPending = () => {
        setOpenPendingModal(true);
    };

    const handleClosePending = () => {
        setOpenPendingModal(false);
    };

    const handleOpenParticipants = async () => {
        await fetchParticipants();
        setOpenParticipantsModal(true);
    };

    const handleCloseParticipants = () => {
        setOpenParticipantsModal(false);
    };

    const handleOpenAdmins = async () => { // <<-- new handler
        await fetchClubAdmins();
        setOpenAdminsModal(true);
    };

    const handleCloseAdmins = () => { // <<-- new handler
        setOpenAdminsModal(false);
    };

    const confirmAndMakeAdmin = async (memberId) => {
        if (window.confirm("Are you sure you want to make this member an admin?")) {
            await makeAdmin(memberId);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#f5f5f5',
            p: 3
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                gap: 2
            }}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #3B82F6, #2563EB)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                }}>
                    Club Chat
                </Typography>
            </Box>

            {/* Buttons for Modals (visible for admin) */}
            <Button
                variant="contained"
                onClick={handleOpenAdmins} // <<-- new button
                sx={{ background: 'linear-gradient(45deg, #3B82F6, #2563EB)' }}
            >
                View Club Admins
            </Button>
            {isAdmin && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleOpenPending}
                        sx={{ background: 'linear-gradient(45deg, #3B82F6, #2563EB)' }}
                    >
                        View Pending Requests
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleOpenParticipants}
                        sx={{ background: 'linear-gradient(45deg, #3B82F6, #2563EB)' }}
                    >
                        View Participants
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowPostDialog(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #3B82F6, #2563EB)',
                            '&:hover': { background: 'linear-gradient(45deg, #2563EB, #1D4ED8)' }
                        }}
                    >
                        Create New Post
                    </Button>
                </Box>
            )}

            {/* Posts List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <Card key={post.id} sx={{
                            mb: 2,
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.3s ease'
                            }
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {post.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {post.content}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    Posted on: {new Date(post.created_at).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card sx={{ textAlign: 'center', py: 4 }}>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary">
                                No posts available
                            </Typography>
                            {isAdmin && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Create a new post to get started!
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Create Post Dialog */}
            <Dialog open={showPostDialog} onClose={() => setShowPostDialog(false)}>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Content"
                        fullWidth
                        multiline
                        rows={4}
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPostDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreatePost} variant="contained">Post</Button>
                </DialogActions>
            </Dialog>

            {/* Pending Requests Modal */}
            <Dialog open={openPendingModal} onClose={handleClosePending}>
                <DialogTitle>Pending Join Requests</DialogTitle>
                <DialogContent>
                    <List>
                        {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                            <ListItem key={request.id}>
                                <ListItemText primary={request.name} secondary={request.regno} />
                                <ListItemSecondaryAction>
                                    <IconButton onClick={() => handleRequest(request.id, 'approve')} color="success">
                                        <CheckIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleRequest(request.id, 'decline')} color="error">
                                        <CloseIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        )) : (
                            <Typography>No pending requests</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePending}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Participants Modal */}
            <Dialog open={openParticipantsModal} onClose={handleCloseParticipants} fullWidth maxWidth="sm">
                <DialogTitle>Participants</DialogTitle>
                <DialogContent>
                    <List>
                        {participants.length > 0 ? participants.map((part) => (
                            <ListItem key={part.id}>
                                <ListItemText primary={part.name} secondary={part.regno} />
                                <ListItemSecondaryAction>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AdminIcon />}
                                        onClick={() => confirmAndMakeAdmin(part.id)}
                                    >
                                        Make Admin
                                    </Button>
                                </ListItemSecondaryAction>
                            </ListItem>
                        )) : (
                            <Typography>No participants available</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseParticipants}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Admins Modal */}
            <Dialog open={openAdminsModal} onClose={handleCloseAdmins}>
                <DialogTitle>Club Admins</DialogTitle>
                <DialogContent>
                    {clubAdmins.length > 0 ? (
                        <List>
                            {clubAdmins.map((admin, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={admin} />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography>No admins found.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAdmins}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Error Alert */}
            {error && (
                <Alert
                    severity="error"
                    onClose={() => setError("")}
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                >
                    {error}
                </Alert>
            )}

            {/* Success Message Alert */}
            {successMessage && (
                <Alert
                    severity="success"
                    onClose={() => setSuccessMessage("")}
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                >
                    {successMessage}
                </Alert>
            )}
        </Box>
    );
};

export default ClubChat;