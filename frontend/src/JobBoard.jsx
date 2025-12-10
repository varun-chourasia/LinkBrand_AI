import React, { useEffect, useState } from 'react';
import { Search, Briefcase, MapPin, ExternalLink, Loader2 } from 'lucide-react';

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("Python"); // Default search

  const fetchJobs = async (skill) => {
    if (!skill) return; // Don't search for empty text
    setLoading(true);
    try {
      // Use your Render URL if deployed, or localhost if testing locally
      // const API_URL = "https://your-render-url.onrender.com"; 
      const API_URL = "http://127.0.0.1:8000";
      
      const response = await fetch(`${API_URL}/api/jobs/recommend?skill=${skill}`);
      const data = await response.json();
      
      console.log(`Searching for ${skill}:`, data); // Debugging

      if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Search automatically on first load (Default: Python)
  useEffect(() => {
    fetchJobs("Python");
  }, []);

  // 2. Handle the manual search
  const handleSearch = () => {
    fetchJobs(searchTerm);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="text-blue-600" /> Recommended Jobs
        </h2>
        
        {/* --- SEARCH BAR --- */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full sm:w-64 border focus-within:border-blue-300 focus-within:bg-white transition-all">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // Allow pressing "Enter" key
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
              placeholder="Search skill (e.g. React)..."
            />
          </div>
          
          {/* --- NEW: SEARCH BUTTON --- */}
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* --- RESULTS AREA --- */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {(!jobs || jobs.length === 0) ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No jobs found for "{searchTerm}".</p>
              <p className="text-xs text-gray-400 mt-1">Try a different keyword like "Java" or "Marketing".</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id || Math.random()} className="group p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all bg-white flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="font-medium text-gray-700 flex items-center gap-1">
                       {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                      {job.platform || "Job Board"}
                    </span>
                  </div>
                </div>
                
                <a 
                  href={job.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all shrink-0"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default JobBoard;