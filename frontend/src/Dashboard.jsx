import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BarChart3, FileText, LogOut, Briefcase, UserCircle, CheckCircle, Sparkles } from 'lucide-react';
import UploadSection from './UploadSection'; // Ensure this component handles the file upload logic we fixed
import PostGenerator from './PostGenerator';
import JobBoard from './JobBoard';
import ProfileAnalyzer from './ProfileAnalyzer';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // --- USER STATE ---
  const [user, setUser] = useState({ name: "User", pic: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // --- DATA STATES ---
  const [profileStats, setProfileStats] = useState(null); 
  const [generatedPosts, setGeneratedPosts] = useState([]); 
  const [skills, setSkills] = useState(["Upload PDF", "To See", "Your Skills"]); 

  useEffect(() => {
    // 1. Handle Authentication (LinkedIn Redirect)
    const token = searchParams.get("token");
    const name = searchParams.get("name");
    const pic = decodeURIComponent(searchParams.get("pic") || "");

    if (token) {
      localStorage.setItem("linkedin_token", token);
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_pic", pic);
      setUser({ name, pic });
      navigate("/dashboard", { replace: true });
    } else {
      const storedName = localStorage.getItem("user_name");
      const storedPic = localStorage.getItem("user_pic");
      if (storedName) setUser({ name: storedName, pic: storedPic });
    }
    
    // 2. Load History
    const savedPosts = JSON.parse(localStorage.getItem("post_history") || "[]");
    if(savedPosts.length > 0) setGeneratedPosts(savedPosts);

  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col fixed h-full z-10 transition-all">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden shadow-sm">
            {user.pic ? <img src={user.pic} alt="Profile" className="w-full h-full object-cover" /> : "LB"}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-gray-800 truncate text-lg">{user.name}</h2>
            <p className="text-xs text-gray-500 font-medium">Free Plan</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1">
          <div onClick={() => setActiveTab("dashboard")}>
             <SidebarItem icon={<BarChart3 size={20} />} text="Overview" active={activeTab === "dashboard"} />
          </div>
          <div onClick={() => setActiveTab("jobs")}>
             <SidebarItem icon={<Briefcase size={20} />} text="Job Matcher" active={activeTab === "jobs"} />
          </div>
          <div onClick={() => setActiveTab("posts")}>
             <SidebarItem icon={<FileText size={20} />} text="Post Generator" active={activeTab === "posts"} />
          </div>
          <div onClick={() => setActiveTab("profile")}>
             <SidebarItem icon={<UserCircle size={20} />} text="Profile Audit" active={activeTab === "profile"} />
          </div>
        </nav>

        {/* Logout */}
        <button 
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="flex items-center gap-3 text-red-500 hover:bg-red-50 p-3 rounded-xl mt-auto transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 ml-64 overflow-y-auto h-screen">
        
        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
             <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name.split(" ")[0]}</h1>
                <p className="text-gray-500">Here is your professional growth summary.</p>
             </div>

             {/* Top Stats Row */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Experience Level" 
                    // FIX: Check for 'years' OR 'years_experience' to prevent undefined
                    value={profileStats ? `${profileStats.years || profileStats.years_experience || 0} Years` : "--"} 
                    subtext={profileStats ? "Verified from PDF" : "Sync Profile PDF to see"}
                    icon={<Briefcase size={18} className="text-blue-500"/>}
                />
                <StatCard 
                    title="Profile Strength" 
                    // FIX: Check for 'summary_rating' OR 'score'
                    value={profileStats ? `${profileStats.summary_rating || profileStats.score || 0}/100` : "--"} 
                    subtext="AI Analysis Score"
                    icon={<Sparkles size={18} className="text-purple-500"/>}
                />
                <StatCard 
                    title="Posts Created" 
                    // FIX: Check for 'posts' OR 'posts_created'
                    value={generatedPosts.length || (profileStats?.posts || 0)} 
                    subtext="Using AI Agent"
                    icon={<FileText size={18} className="text-green-500"/>}
                />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                   {/* Upload / Sync Section */}
                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <div className="flex items-center justify-between mb-6">
                           <h3 className="font-bold text-gray-800">Profile Sync</h3>
                           {profileStats && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>}
                       </div>
                       
                       {/* PASS DATA UP TO DASHBOARD STATE */}
                       <UploadSection onAnalysisComplete={(data) => {
                           console.log("Dashboard received stats:", data); // Debugging
                           setProfileStats(data);
                           
                           // Handle skills extraction
                           if (data.skills && data.skills.length > 0) {
                               setSkills(data.skills.slice(0, 10)); 
                           } else if (data.extracted_text) {
                               // Fallback: If no explicit skills list, just show generic success
                               setSkills(["PDF Scanned", "Data Ready", "AI Active"]);
                           }
                       }} />
                   </div>

                   {/* Recent Posts Feed */}
                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <h3 className="font-bold text-gray-800 mb-4">Recent AI Posts</h3>
                       {generatedPosts.length === 0 ? (
                           <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                               <p>No posts generated yet.</p>
                               <button onClick={() => setActiveTab("posts")} className="mt-2 text-blue-600 font-semibold hover:underline">
                                   Create your first post &rarr;
                               </button>
                           </div>
                       ) : (
                           <div className="space-y-4">
                               {generatedPosts.slice(0, 3).map((post, i) => (
                                   <div key={i} className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                       <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">"{post}"</p>
                                       <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 font-semibold">
                                           <Sparkles size={12} /> Generated by AI
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-8">
                   {/* Skills List */}
                   <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                       <div className="flex items-center justify-between mb-4">
                           <h3 className="font-bold text-gray-800">Top Skills</h3>
                       </div>
                       <div className="flex flex-wrap gap-2">
                           {skills.map((skill, index) => (
                               <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                   {skill}
                               </span>
                           ))}
                       </div>
                   </div>

                   {/* Quick Action Card */}
                   <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                       <div className="relative z-10">
                           <h3 className="font-bold text-lg mb-1">Boost Your Reach</h3>
                           <p className="text-indigo-100 text-sm mb-4 opacity-90">Post consistently to grow your network by 30% this month.</p>
                           <button 
                               onClick={() => setActiveTab("posts")} 
                               className="w-full py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-md"
                           >
                               Generate New Post
                           </button>
                       </div>
                       {/* Decorative circle */}
                       <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW 2: JOB MATCHER */}
        {activeTab === "jobs" && (
            <div className="animate-fade-in max-w-5xl mx-auto">
                <JobBoard />
            </div>
        )}

        {/* VIEW 3: POST GENERATOR */}
        {activeTab === "posts" && (
            <div className="animate-fade-in max-w-4xl mx-auto mt-4">
                <PostGenerator onPostCreated={(txt) => {
                    const newHistory = [txt, ...generatedPosts];
                    setGeneratedPosts(newHistory);
                    localStorage.setItem("post_history", JSON.stringify(newHistory));
                }}/>
            </div>
        )}

        {/* VIEW 4: PROFILE AUDIT */}
        {activeTab === "profile" && (
            <div className="animate-fade-in max-w-4xl mx-auto mt-4">
                <ProfileAnalyzer onAnalysisComplete={(data) => {
                    // Update main dashboard stats from this tab too
                    setProfileStats(data);
                }}/>
            </div>
        )}

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function SidebarItem({ icon, text, active }) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${active ? "bg-blue-50 text-blue-700 font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
      {icon}
      <span className="tracking-wide text-sm">{text}</span>
    </div>
  );
}

function StatCard({ title, value, subtext, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-2">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
            {icon}
          </div>
      </div>
      <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>
    </div>
  );
}