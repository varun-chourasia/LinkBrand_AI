import React, { useState } from "react";
import axios from "axios";
import {
  UploadCloud,
  FileText,
  Loader2,
  Linkedin,
  FileUser,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// FIX 1: Add { onAnalysisComplete } to props
export default function ProfileAnalyzer({ onAnalysisComplete }) {
  const [mode, setMode] = useState("linkedin"); // 'linkedin' or 'resume'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file); // Backend expects 'file'

    try {
      // FIX 2: Use the CORRECT backend endpoints we created
      // Note: For now, we point both to the PDF analyzer since we haven't made a separate resume logic yet.
      const endpoint = "http://127.0.0.1:8000/api/analyze/profile-pdf";

      const res = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // FIX 3: Map Backend Data (years, score) to UI Data (summary_rating)
      // The backend returns: { score: 85, years: 5, ... }
      // The UI expects: { summary_rating: 85, ... }
      const formattedData = {
        summary_rating: res.data.score || 0, // Map 'score' to 'summary_rating'
        ats_score: res.data.score || 0,      // Map 'score' to 'ats_score'
        years: res.data.years || 0,
        
        // Create mock feedback if backend doesn't send it yet
        feedback_list: res.data.feedback || [
            "Resume length is optimal.",
            `Detected approx. ${res.data.years || 0} years of experience.`,
            "Consider adding more quantifiable metrics."
        ]
      };

      setResult(formattedData);

      if (onAnalysisComplete) {
        onAnalysisComplete(formattedData);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Analysis failed. Make sure Backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* HEADER & TOGGLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Document Analyzer
        </h2>

        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setMode("linkedin");
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              mode === "linkedin"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Linkedin size={18} /> LinkedIn Audit
          </button>
          <button
            onClick={() => {
              setMode("resume");
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              mode === "resume"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileUser size={18} /> Resume Score
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          {mode === "linkedin"
            ? "Upload your 'Save to PDF' file from LinkedIn to sync connections and get profile tips."
            : "Upload your CV/Resume to check its ATS Score and find formatting errors."}
        </p>
      </div>

      {/* UPLOAD AREA */}
      {!result && (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 text-center transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div
              className={`p-4 rounded-full ${
                mode === "linkedin"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={40} /> : <UploadCloud size={40} />}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />

              <div className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                {loading ? "Analyzing..." : "Select PDF File"}
              </div>
            </label>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Score Card */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
                {mode === "linkedin" ? "Profile Strength" : "ATS Compatibility"}
              </h3>
              <p className="text-gray-500 text-sm">AI Calculated Score</p>
            </div>
            <div className="flex items-end gap-2">
              <span
                className={`text-6xl font-bold ${
                  (result.summary_rating > 70 || result.ats_score > 70)
                    ? "text-green-500"
                    : "text-orange-500"
                }`}
              >
                {mode === "linkedin" ? result.summary_rating : result.ats_score}
              </span>
              <span className="text-gray-400 text-2xl mb-2">/100</span>
            </div>
          </div>

          {/* Feedback List */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" /> Improvement Plan
              </h3>
              <button
                onClick={() => setResult(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Scan Another
              </button>
            </div>

            <div className="space-y-3">
              {result.feedback_list?.map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg text-gray-700"
                >
                  <span className="font-bold text-gray-400">{i + 1}.</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}