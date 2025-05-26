import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ParticularClub.css';

const ParticularClub = () => {
    const navigate = useNavigate();
    const { clubId } = useParams();
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [messages, setMessages] = useState([
        { id: 1, text: "Welcome to the club!", sender: "admin", timestamp: "10:00 AM" },
        { id: 2, text: "Next meeting on Friday", sender: "admin", timestamp: "10:05 AM" },
    ]);
    const isAdmin = true; // Set based on our admin check logic

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
            setSelectedFile(file);
        }
    };

    const handleSendMessage = () => {
        if ((message.trim() || selectedFile) && isAdmin) {
            const newMessage = {
                id: messages.length + 1,
                text: message,
                sender: "admin",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                file: selectedFile ? {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    url: URL.createObjectURL(selectedFile)
                } : null
            };
            
            setMessages([...messages, newMessage]);
            setMessage('');
            setSelectedFile(null);
        }
    };

    return (
        <div className="club-container">
            {/* Header */}
            <div className="club-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ←
                </button>
                <div className="club-info">
                    <div className="club-icon">👥</div>
                    <div>
                    <h2 className="club-name">{clubId.replace(/-/g, ' ')}</h2>
                        <p className="club-members">1.2k members</p>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="messages-container">
                {messages.map((msg) => (
                    <div 
                        key={msg.id}
                        className={`message ${msg.sender === 'admin' ? 'admin-message' : 'user-message'}`}
                    >
                        {msg.file && (
                            <div className="file-message">
                                {msg.file.type.startsWith('image/') ? (
                                    <img 
                                        src={msg.file.url} 
                                        alt={msg.file.name} 
                                        className="sent-image" 
                                    />
                                ) : (
                                    <a 
                                        href={msg.file.url} 
                                        download 
                                        className="file-download-link"
                                    >
                                        📄 {msg.file.name}
                                    </a>
                                )}
                            </div>
                        )}
                        <div className="message-content">
                            {msg.text}
                            <span className="message-time">{msg.timestamp}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area (Visible only to admins) */}
            {isAdmin && (
                <div className="message-input-container">
                    <label className="file-upload-button">
                        📎
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden-file-input"
                        />
                    </label>
                    
                    {selectedFile && (
                        <div className="file-preview">
                            {selectedFile.type.startsWith('image/') ? (
                                <img 
                                    src={URL.createObjectURL(selectedFile)} 
                                    alt="Preview" 
                                    className="file-preview-image"
                                />
                            ) : (
                                <span className="file-name">{selectedFile.name}</span>
                            )}
                            <button 
                                className="remove-file-button"
                                onClick={() => setSelectedFile(null)}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <input
                     type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="message-input"
                    />

                    <button 
                        onClick={handleSendMessage}
                        className="send-button"
                        disabled={!message.trim() && !selectedFile}
                    >
                        Send
                    </button>
                </div>
            )}
        </div>
    );
};

export default ParticularClub;