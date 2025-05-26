import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <motion.div
                className="hero-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <h1>Welcome to College Connect</h1>
                <p className="hero-subtitle">Your Campus Community Hub</p>
                <div className="cta-buttons">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/signup')}
                        className="primary-btn"
                    >
                        Get Started
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/login')}
                        className="secondary-btn"
                    >
                        login In
                    </motion.button>
                </div>
            </motion.div>

            <div className="features-section">
                <motion.div
                    className="feature-card"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3>Connect with Peers</h3>
                    <p>Build meaningful connections with students across your campus</p>
                </motion.div>

                <motion.div
                    className="feature-card"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3>Share Knowledge</h3>
                    <p>Exchange ideas, notes, and experiences with your college community</p>
                </motion.div>

                <motion.div
                    className="feature-card"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3>Stay Updated</h3>
                    <p>Never miss important campus events and announcements</p>
                </motion.div>
            </div>
        </div>
    );
};

export default HomePage;

