import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:5000"; 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true"); 
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("userEmail") || "");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  
  const [view, setView] = useState("dashboard"); 
  const [mode, setMode] = useState("url");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [filterTab, setFilterTab] = useState("ALL");

  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setView("dashboard");
    alert("Logged out successfully!");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail && loginPass) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", loginEmail);
      setCurrentUser(loginEmail);
      setIsLoggedIn(true);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/history`);
      const data = await res.json();
      setFullHistory(data);
      setView("history");
    } catch (e) { 
      console.error("History error"); 
      setView("history"); 
    }
  };

  const handleQRScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/scan_qr`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setInput(data.url);
        setMode("url");
        alert("QR Scan Success!");
      } else { alert(data.error || "QR detect aagala!"); }
    } catch (err) { alert("Backend Error!"); }
    finally { setLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, content: input })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) { alert("Backend Check Pannunga!"); }
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg; setChatMsg("");
    setChatHistory(p => [...p, { role: "user", text: msg }]);
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setChatHistory(p => [...p, { role: "bot", text: data.reply }]);
    } catch (e) { setChatHistory(p => [...p, { role: "bot", text: "AI is busy!" }]); }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-page glass-bg">
        <div className="login-card glass-card">
          <h1>🛡️ Welcome Back</h1>
          <form onSubmit={handleLogin} className="login-form">
            <input type="email" placeholder="Email" className="glass-input-small" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="glass-input-small" value={loginPass} onChange={(e)=>setLoginPass(e.target.value)} required />
            <button type="submit" className="analyze-btn">Login Now ⚡</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-fade">
      <nav className="top-nav glass-nav">
        <h2 className="logo">🛡️ Cyber Assistant</h2>
        <div className="nav-group">
          <span className="user-info">Hi, {currentUser} 👋</span>
          <div className="nav-links">
            <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
            <button className={view === "history" ? "active" : ""} onClick={fetchHistory}>History</button>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {view === "dashboard" ? (
          <div className="container glass-card">
            <div className="mode-tabs">
              {["url", "email", "sms", "qr"].map(m => (
                <button key={m} className={mode === m ? "active-tab" : ""} onClick={() => {setMode(m); setResult(null); setInput("");}}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {mode === "qr" && (
              <div className="qr-upload-section">
                <label className="qr-label">
                  📸 Upload QR Image
                  <input type="file" accept="image/*" onChange={handleQRScan} hidden />
                </label>
                <p className="qr-hint">Scan panna aprum link kela varum</p>
              </div>
            )}

            <textarea 
              className="glass-input"
              placeholder={`Paste ${mode} here...`} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
            />
            
            <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Now ⚡"}
            </button>

            {/* --- UPDATED RESULT AREA WITH ROUND RISK METER --- */}
            {result && (
              <div className="result-area animate-fade">
                <div className="risk-meter">
                  <div 
                    className="meter-circle" 
                    style={{
                      background: `conic-gradient(${
                        result.result === 'Phishing' ? '#ff4d4d' : '#4dff88'
                      } ${result.risk_score * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`
                    }}
                  >
                    <div className="meter-inner">
                      <span>{result.risk_score}%</span>
                    </div>
                  </div>
                </div>
                <h2 className={result.result === 'Phishing' ? 'text-red' : 'text-green'}>
                    {result.result}
                </h2>
              </div>
            )}
          </div>
        ) : (
          <div className="container glass-card wide">
            <h3>📊 Scan History</h3>
            <div className="table-scroll">
              <table className="history-table">
                <thead><tr><th>Type</th><th>Content</th><th>Result</th><th>Risk</th></tr></thead>
                <tbody>
                  {fullHistory.filter(h => filterTab==="ALL" || h.type.toUpperCase()===filterTab).map(h => (
                    <tr key={h.id}>
                      <td><span className={`tag ${h.type.toLowerCase()}`}>{h.type}</span></td>
                      <td className="cell-truncate">{h.content}</td>
                      <td className={h.result==='Phishing'?'text-red':'text-green'}>{h.result}</td>
                      <td>{h.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <div className={`chat-widget-pro ${chatOpen ? "active" : ""}`}>
        <button className="chat-trigger" onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? "✕" : "💬"}</button>
        {chatOpen && (
          <div className="chat-window glass">
            <div className="chat-header">Cyber Bot</div>
            <div className="chat-body">
              {chatHistory.map((c, i) => <div key={i} className={`chat-msg ${c.role}`}>{c.text}</div>)}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-footer">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyPress={e => e.key==='Enter' && handleChat()} placeholder="Type message..." />
              <button onClick={handleChat}>➤</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}