import React, { useState } from 'react';
import axios from 'axios';
import { PenTool, Send, Copy, Check, Linkedin } from 'lucide-react';

export default function PostGenerator() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generatedPost, setGeneratedPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setGeneratedPost("");
    
    try {
      const res = await axios.post("http://localhost:8000/api/generate/post", {
        topic: topic,
        tone: tone
      });
      setGeneratedPost(res.data.content);
    } catch (err) {
      alert("Failed to generate. Check Backend.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    const token = localStorage.getItem("linkedin_token");
    if (!token) return alert("You must be logged in to post!");
    
    if(!confirm("Are you sure you want to post this to your real LinkedIn profile?")) return;

    try {
        await axios.post("http://localhost:8000/api/publish/linkedin", {
            token: token,
            text: generatedPost
        });
        alert("Success! Post is live on LinkedIn.");
    } catch (err) {
        // Ab ye exact reason batayega (Example: "LinkedIn Rejected: Duplicate Post")
        alert(err.response?.data?.detail || "Failed to publish.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
          <PenTool size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">AI Post Generator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What do you want to post about?</label>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The future of AI in 2025..."
            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Tone</label>
          <select 
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg outline-none"
          >
            <option>Professional</option>
            <option>Excited</option>
            <option>Controversial</option>
            <option>Educational</option>
            <option>Humorous</option>
          </select>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          {loading ? "AI is writing..." : <><Send size={18} /> Generate Post</>}
        </button>
      </div>

      {generatedPost && (
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Generated Draft:</h3>
            <div className="flex gap-2">
                <button 
                onClick={copyToClipboard}
                className="text-sm flex items-center gap-1 text-gray-500 hover:text-purple-600 border px-3 py-1 rounded"
                >
                {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy</>}
                </button>
                
                <button 
                onClick={handlePublish}
                className="text-sm flex items-center gap-1 bg-[#0077b5] text-white px-3 py-1 rounded hover:bg-[#005582]"
                >
                 <Linkedin size={14} /> Post Now
                </button>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
            {generatedPost}
          </div>
        </div>
      )}
    </div>
  );
}