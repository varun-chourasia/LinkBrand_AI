import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, Loader2, CheckCircle, BrainCircuit } from 'lucide-react';

export default function UploadSection({ onAnalysisComplete }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Hit the new endpoint
      const res = await axios.post("http://localhost:8000/api/analyze/profile-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setStats(res.data);
      if (onAnalysisComplete) onAnalysisComplete(res.data); // Update Dashboard
      
    } catch (err) {
      alert("Failed to analyze PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. UPLOAD AREA */}
      {!stats && (
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                    <UploadCloud size={32} />
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Instant Profile Sync</h3>
                    <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
                        Go to your LinkedIn Profile &gt; Click "More" &gt; <b>"Save to PDF"</b>.
                        <br/>Upload that file here to auto-fill your dashboard.
                    </p>
                </div>

                <label className="cursor-pointer">
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    <div className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 flex items-center gap-2 transition-transform active:scale-95">
                        {loading ? <Loader2 className="animate-spin" size={20}/> : <FileText size={20}/>}
                        {loading ? "AI is Extracting Data..." : "Upload Profile PDF"}
                    </div>
                </label>
            </div>
        </div>
      )}

      {/* 2. SUCCESS VIEW */}
      {stats && (
        <div className="animate-fade-in bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle size={24} />
                <span className="font-bold">Sync Complete! Your profile has been analyzed.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Latest Role</p>
                    <p className="text-lg font-bold text-gray-800">{stats.top_experience}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Experience</p>
                    <p className="text-lg font-bold text-gray-800">{stats.years_experience} Years</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}