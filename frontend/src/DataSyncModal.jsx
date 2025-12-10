import React, { useState } from 'react';
import axios from 'axios';
import { X, UploadCloud, Link, Loader2, FileText } from 'lucide-react';

export default function DataSyncModal({ isOpen, onClose, onSyncComplete }) {
  const [activeMode, setActiveMode] = useState('pdf'); // 'pdf' or 'url'
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handler for PDF Upload
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/api/analyze/linkedin", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (onSyncComplete) onSyncComplete(res.data);
      onClose();
    } catch (err) {
      alert("PDF Analysis Failed. Check Backend.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for URL Scrape (Optional/Future feature)
  const handleUrlScrape = async () => {
    if (!url) return;
    setLoading(true);
    try {
      // Note: This endpoint needs the Selenium scraper setup in backend to work
      const res = await axios.post("http://localhost:8000/api/analyze/scrape-url", { url });
      if (onSyncComplete) onSyncComplete(res.data);
      onClose();
    } catch (err) {
      alert("Scraping Failed. Make sure Backend Selenium is configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden m-4">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Update Profile Data</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`flex-1 p-4 font-medium text-sm flex items-center justify-center gap-2 ${activeMode === 'pdf' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}
            onClick={() => setActiveMode('pdf')}
          >
            <UploadCloud size={16}/> Upload PDF
          </button>
          <button 
            className={`flex-1 p-4 font-medium text-sm flex items-center justify-center gap-2 ${activeMode === 'url' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500'}`}
            onClick={() => setActiveMode('url')}
          >
            <Link size={16}/> LinkedIn URL
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
             <div className="text-center py-8">
               <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={32}/>
               <p className="text-gray-500">{activeMode === 'url' ? "Scraping..." : "Analyzing PDF..."}</p>
             </div>
          ) : (
            <>
              {activeMode === 'pdf' && (
                <div className="text-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 transition-colors">
                   <p className="text-sm text-gray-500 mb-4">Export Profile to PDF from LinkedIn and drop here.</p>
                   <label className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
                     <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                     Select File
                   </label>
                </div>
              )}

              {activeMode === 'url' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Enter your public profile URL. (Requires backend scraper)</p>
                  <input 
                    type="text" 
                    placeholder="https://www.linkedin.com/in/username" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button 
                    onClick={handleUrlScrape}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700"
                  >
                    Start Scraping
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}