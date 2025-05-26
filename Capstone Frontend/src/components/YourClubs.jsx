import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/YourClubs.css";

const YourClubs = () => {
    const navigate = useNavigate();
    const [participatedClubs, setParticipatedClubs] = useState([]);
    const [allClubs, setAllClubs] = useState([]);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        // Fetch current user info to get the user's id
        axios.get('https://prabhavit-project-backend.onrender.com/api/v1/users/me', { withCredentials: true })
            .then(res => {
                setUserId(res.data.id);
                // Fix the API endpoint path
                axios.get(`https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${res.data.id}/clubs`, { withCredentials: true })
                    .then(resp => {
                        console.log("Participated clubs:", resp.data);
                        setParticipatedClubs(resp.data);
                    })
                    .catch(err => {
                        console.error("Error fetching participated clubs", err);
                    });
            })
            .catch(err => {
                console.error("Error fetching user info", err);
            });

        // Fix the API endpoint path for all clubs
        axios.get('https://prabhavit-project-backend.onrender.com/api/v1/club-chat/clubs/all', { withCredentials: true })
            .then(res => {
                console.log("All clubs:", res.data);
                setAllClubs(res.data);
            })
            .catch(err => {
                console.error("Error fetching all clubs", err);
            });
    }, []);

    const handleJoinClub = async (clubId) => {
        try {
            await axios.post(
                `https://prabhavit-project-backend.onrender.com/api/v1/club-chat/${clubId}/join`,
                {
                    user_id: userId
                },
                { withCredentials: true }
            );
            alert('Join request sent successfully!');
            // Refresh the clubs lists after successful join request
            window.location.reload();
        } catch (error) {
            console.error('Error sending join request:', error);
            if (error.response?.data?.detail) {
                alert(`Failed to send join request: ${error.response.data.detail}`);
            } else {
                alert('Failed to send join request. Please try again.');
            }
        }
    };

    return (
        <div className="your-clubs-container">
            <nav className="nav-header">
                <button className="back-button" onClick={() => navigate(-1)}>Back</button>
            </nav>
            <div className="main-content">
                <h2 className="section-heading">Your Clubs</h2>
                <div className="clubs-grid">
                    {participatedClubs.length ? participatedClubs.map(club => (
                        <div key={club.id} className="club-card">
                            <img src={club.image_url || '/default-club.png'} alt={club.name} className="club-image" />
                            <h3 className="club-name">{club.name}</h3>
                            <p className="club-members">{club.members.length} members</p>
                            <button className="open-club-btn" onClick={() => navigate(`/club/${club.id}`)}>
                                Open Club
                            </button>
                        </div>
                    )) : <p>No clubs joined yet.</p>}
                </div>
                <h2 className="section-heading">All Clubs</h2>
                <div className="clubs-grid">
                    {allClubs.map(club => (
                        <div key={club.id} className="club-card">
                            <img src={club.image_url || '/default-club.png'} alt={club.name} className="club-image" />
                            <h3 className="club-name">{club.name}</h3>
                            <p className="club-members">{club.members.length} members</p>
                            <button
                                className="join-club-btn"
                                onClick={() => handleJoinClub(club.id)}
                            >
                                Join Club
                            </button>
                        </div>
                    ))}
                </div>
                <div className="more-button-container">
                    <button className="more-button">More</button>
                </div>
            </div>
        </div>
    );
};

export default YourClubs;