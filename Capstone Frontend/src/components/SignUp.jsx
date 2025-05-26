import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp = () => {
    const [name, setName] = useState("");
    const [registerNo, setRegisterNo] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            const response = await axios.post("http://localhost:8000/api/v1/users/register", {
                name: name,
                regno: registerNo,
                email: email,
                password: password,
            });
            if (response.status === 200) {
                navigate("/login");
            }
        } catch (err) {
            setError("Error signing up. Please try again.");
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

                {/* Right Section (Sign Up Form) */}
                <div className="w-full md:w-1/2 p-4 md:p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Join & Connect the Community</h4>

                    <form onSubmit={handleSignUp} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name:</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="Sandy Bhayy"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                            <input
                                type="email"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="wassuppp@vitbhopal.ac.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password:</label>
                            <input
                                type="password"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition-all"
                        >
                            SIGN UP
                        </button>
                    </form>

                    <p className="mt-3 text-sm text-center text-gray-600">
                        Already have an account?
                        <a href="/login" className="text-blue-500 font-bold ml-1">LOG IN</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;