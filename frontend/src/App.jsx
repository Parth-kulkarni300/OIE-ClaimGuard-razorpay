import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('portal');
  
  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          OIE<span>ClaimGuard</span>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            className={activeTab === 'portal' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('portal')}
          >
            Claim Portal
          </button>
          <button 
            className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('dashboard')}
          >
            Investigator Dashboard
          </button>
        </div>
      </nav>

      <main>
        {activeTab === 'portal' ? <ClaimPortal /> : <InvestigatorDashboard />}
      </main>
    </div>
  );
}

function ClaimPortal() {
  const [claimText, setClaimText] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Processing via AI...');
    
    const formData = new FormData();
    formData.append('description', claimText);
    if (file) {
      formData.append('evidence', file);
    }

    try {
      const response = await fetch('http://localhost:3000/api/claims', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.claim.analysis.decision === 'AUTO_PAY') {
        setStatus(`✅ Approved! Payout initiated via RazorpayX (ID: ${data.claim.payoutDetails?.id})`);
      } else {
        setStatus(`⚠️ Claim Flagged. Sent to Investigator Dashboard. Reason: ${data.claim.analysis.reasoning}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('Error submitting claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '10px' }}>File an Auto Claim</h2>
      <p style={{ marginBottom: '30px' }}>Our AI-driven triage system will process your claim instantly. Try words like "minor scratch" for auto-pay, or "totaled" for fraud detection.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label className="label">Describe the accident</label>
          <textarea 
            className="input-field" 
            rows="4" 
            placeholder='E.g., "minor scratch on bumper" OR "car is completely totaled"'
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
            required
          ></textarea>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <label className="label">Upload Evidence (Photos)</label>
          <input 
            type="file" 
            className="input-field" 
            accept="image/*" 
            onChange={(e) => setFile(e.target.files[0])}
            required 
          />
        </div>
        
        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Processing...' : 'Submit Claim'}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <strong>Status:</strong> {status}
        </div>
      )}
    </div>
  );
}

function InvestigatorDashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/claims')
      .then(res => res.json())
      .then(data => {
        setClaims(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '20px' }}>Investigator Dashboard</h2>
      <p>High-risk claims flagged by the Agentic AI appear here for manual review.</p>
      
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading ? <p>Loading claims...</p> : claims.length === 0 ? <p>No claims submitted yet.</p> : claims.map(claim => (
          <div key={claim.id} style={{ 
            padding: '20px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '12px', 
            borderLeft: `4px solid ${claim.analysis.decision === 'AUTO_PAY' ? 'var(--success-color)' : 'var(--danger-color)'}` 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Claim {claim.id}</h3>
              <span style={{ 
                color: claim.analysis.decision === 'AUTO_PAY' ? 'var(--success-color)' : 'var(--danger-color)', 
                fontWeight: 'bold' 
              }}>
                Risk Score: {claim.analysis.riskScore}/100
              </span>
            </div>
            <p style={{ marginTop: '10px' }}><strong>Description:</strong> {claim.description}</p>
            <p style={{ marginTop: '5px' }}><strong>AI Reasoning:</strong> {claim.analysis.reasoning}</p>
            <p style={{ marginTop: '5px' }}><strong>Status:</strong> {claim.status}</p>
            {claim.analysis.decision !== 'AUTO_PAY' && (
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ padding: '8px 16px' }}>View Details</button>
                <button className="btn-secondary" style={{ padding: '8px 16px' }}>Reject Claim</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
