import React from "react";
import {Linkedin} from 'lucide-react';

export default function Login() {
    const handleLogin = () => {
        // redirect to your backend auth endpoint 
        window.location.href = "auth/login";
    };

    return (
        <div className="flex item-center justify-center h-screen bg-grey-100">
            <div className="bg-whit p-10 rounded-xl shadow-lg text-center max-w-sm w-full">
                <h1 className="text-2xl font-bold mb-2 text-gray-800">LinkBrand AI</h1>
                <p className="text-grey-500 mb-6">Optimize your professional presence</p>

                <button
                    onClick={handleLogin}
                    className="w-full flex itmes-center justify-center justify-center gap-2 bg-[#0077b5] text-white py-3 rounded-lg font-semibold hover:bg-[#005582] transition-colors">
                        <Linkedin size={20} />
                        Sign in with LinkedIn
                    </button>
            </div>
        </div>
    );
}