import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
    const [registerNo, setRegisterNo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("https://prabhavit-project-backend.onrender.com/api/v1/users/login", {
                regno: registerNo,
                password: password,
            },
                {
                    withCredentials: true
                }
            );


            if (response.status === 200) {
                // Extract token from response body or header
                const token = response.data.token ||
                    (response.headers.authorization &&
                        response.headers.authorization.startsWith('Bearer ') ?
                        response.headers.authorization.substring(7) : null);

                // If token exists and cookie wasn't set by server, set it manually
                if (token && !document.cookie.includes('access_token')) {
                    document.cookie = `access_token=${token}; path=/; max-age=3600; samesite=lax;`;
                }

                // Store token in localStorage as backup
                localStorage.setItem('access_token', token);



                // Navigate to feed page
                navigate("/feed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Invalid login credentials. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-2 bg-gradient-to-r from-blue-400 to-blue-600">
            <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-xl overflow-hidden">
                {/* Left Section */}
                <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-6 bg-white text-black">
                    <div className="w-full flex justify-center mb-4">
                        <img src="src/assets/image.png" alt="PrabhaVIT" className="w-48 rounded-xl" />
                    </div>
                    <h1 className="text-xl font-bold text-center">Online Community For Students of VIT Bhopal</h1>
                </div>

                {/* Right Section (Login Form) */}
                <div className="w-full md:w-1/2 p-4 md:p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Join & Connect the Community</h4>

                    {/* <div className="flex space-x-4 mt-4">
                        <button className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 w-1/2 text-sm">
                            <img src="src/assets/google.png" className="w-5 h-5 mr-2" alt="Google" /> Sign in with Google
                        </button>
                        <button className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 w-1/2 text-sm">
                            <img src="src/assets/github.png" className="w-5 h-5 mr-2" alt="GitHub" /> Sign in with GitHub
                        </button>
                    </div> */}

                    <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Register No:</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="21BAI10041"
                                value={registerNo}
                                onChange={(e) => setRegisterNo(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                            <input
                                type="password"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition-all"
                        >
                            LOG IN
                        </button>
                    </form>

                    <p className="mt-4 text-sm text-center text-gray-600">
                        Don't have an account? <a href="/signup" className="text-blue-500 font-bold">SIGN UP</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
