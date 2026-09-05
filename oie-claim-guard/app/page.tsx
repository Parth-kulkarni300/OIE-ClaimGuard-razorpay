'use client'

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileImage,
  Gauge,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  Lock,
  Mail,
  User,
  History,
  Mic,
  Download,
  Zap,
  CreditCard
} from 'lucide-react'

type Role = 'login' | 'customer' | 'agent'
type ClaimStatus = 'Pending Review' | 'Approved' | 'Flagged'
type AgentTab = 'overview' | 'investigations' | 'analytics' | 'payouts'
type CustomerTab = 'overview' | 'file' | 'history' | 'billing'

type Claim = {
  id: string
  name: string
  vehicle: string
  claimId: string
  submitted: string
  risk: number
  status: ClaimStatus
  description: string
  image: string
  reasoning: string
  payoutStatus?: string
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark"><ShieldCheck size={21} strokeWidth={2.5} /></div>
      {!compact && <div><div className="text-sm font-semibold tracking-tight text-white">OIE-ClaimGuard</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Intelligent claims</div></div>}
    </div>
  )
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card ${className}`}>{children}</div>
}

function Login({ onSelect }: { onSelect: (role: Role) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === 'customer@demo.com' && password === 'demo') {
      onSelect('customer')
    } else if (email === 'agent@demo.com' && password === 'demo') {
      onSelect('agent')
    } else {
      setError('Invalid credentials. Use customer@demo.com or agent@demo.com with password: demo')
    }
  }

  return (
    <main className="min-h-screen overflow-hidden px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <Logo />
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_420px]">
          <div className="max-w-xl">
            <div className="eyebrow"><Sparkles size={14} /> Intelligent claims operations</div>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.06] tracking-[-0.055em] text-white sm:text-7xl">Claims, resolved<br /><span className="text-cyan">with confidence.</span></h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-slate-400">OIE-ClaimGuard combines agentic AI with human expertise to make every claim decision faster, fairer, and easier to trust.</p>
            <div className="mt-9 flex flex-wrap gap-6 text-xs text-slate-500"><span className="flex items-center gap-2"><BadgeCheck size={16} className="text-cyan" /> 98.4% decision accuracy</span><span className="flex items-center gap-2"><Clock3 size={16} className="text-cyan" /> 10x faster resolution</span></div>
          </div>
          <GlassCard className="p-7 sm:p-8">
            <div className="mb-6"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/10 text-cyan"><Lock size={25} /></div><h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">Secure Login</h2><p className="mt-2 text-sm leading-6 text-slate-400">Enter your credentials to access the workspace.</p></div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="field-label flex items-center gap-2"><Mail size={14}/> Email address</label>
                <input type="email" required className="field-input w-full" placeholder="customer@demo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="field-label flex items-center gap-2"><Lock size={14}/> Password</label>
                <input type="password" required className="field-input w-full" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-xs text-coral">{error}</p>}
              <button type="submit" className="primary-button w-full mt-4">Sign in <ArrowRight size={16} className="ml-auto" /></button>
            </form>
            
            <div className="mt-8 border-t border-white/8 pt-5 text-xs text-slate-500 space-y-2">
              <p><strong>Demo Credentials:</strong></p>
              <p>Customer: <span className="text-white">customer@demo.com</span> / <span className="text-white">demo</span></p>
              <p>Agent: <span className="text-white">agent@demo.com</span> / <span className="text-white">demo</span></p>
            </div>
          </GlassCard>
        </div>
        <div className="flex justify-between text-xs text-slate-600"><span>© 2025 OIE Insurance</span><span>Secure by design</span></div>
      </div>
    </main>
  )
}

function TopBar({ role, onBack, name = "Alex Kumar", initials = "AK" }: { role: string; onBack: () => void; name?: string; initials?: string }) {
  return <header className="flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8"><button onClick={onBack} className="flex items-center gap-3"><Logo compact /><span className="hidden border-l border-white/10 pl-3 text-xs text-slate-500 sm:inline">{role}</span></button><div className="flex items-center gap-3"><button className="icon-button" aria-label="Notifications"><Bell size={17} /></button><div className="flex items-center gap-2 border-l border-white/10 pl-3"><div className="avatar">{initials}</div><span className="hidden text-xs text-slate-300 sm:inline">{name}</span></div></div></header>
}

function Customer({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<CustomerTab>('overview')
  const [sidebar, setSidebar] = useState(false)
  const [stage, setStage] = useState<'form' | 'loading' | 'success'>('form')
  const [dragging, setDragging] = useState(false)
  const [listening, setListening] = useState(false)
  const [isPremiumPaid, setIsPremiumPaid] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [values, setValues] = useState({ name: 'Ananya Rao', claim: 'CLM-' + Math.floor(1000 + Math.random() * 9000), vehicle: 'MH 12 AB 4821', description: '' })
  
  const [claims, setClaims] = useState<Claim[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const fetchClaims = () => {
    fetch('http://localhost:3001/api/claims')
      .then(res => res.json())
      .then(data => { setClaims(data); setLoadingHistory(false) })
      .catch(err => { console.error(err); setLoadingHistory(false) })
  }

  useEffect(() => {
    if (tab === 'history' || tab === 'overview') fetchClaims()
  }, [tab])

  useEffect(() => {
    // Load Razorpay Checkout Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const setField = (key: keyof typeof values) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [key]: event.target.value })
  const onFile = (files: FileList | null) => { if (files?.[0]) setFile(files[0]) }
  
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser. Please type.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValues(prev => ({ ...prev, description: prev.description + (prev.description ? ' ' : '') + transcript }));
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  const submit = async () => { 
    if (!values.name || !values.claim || !values.vehicle || !values.description || !file) {
      alert("Please fill out all fields and upload an image.");
      return;
    }
    setStage('loading'); 
    
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('claimId', values.claim);
    formData.append('vehicle', values.vehicle);
    formData.append('description', values.description);
    formData.append('evidence', file);

    try {
      const res = await fetch('http://localhost:3001/api/claims', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.claim.status === 'Approved') {
        setStage('success');
      } else {
        alert("Claim flagged and sent to Agent Dashboard for manual review.\n\nAI Reasoning: " + data.claim.reasoning);
        setStage('form');
        setValues({ ...values, claim: 'CLM-' + Math.floor(1000 + Math.random() * 9000), description: '' });
        setFile(null);
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting claim. Is backend running on port 3001?");
      setStage('form');
    }
  }

  const payPremium = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1500 })
      });
      const data = await res.json();
      
      if (!data.order_id) {
        alert("Could not generate Razorpay order. Check backend .env");
        return;
      }
      
      const options = {
        key: "rzp_test_TXDYq2F9sQqsxe",
        amount: "150000",
        currency: "INR",
        name: "OIE-ClaimGuard",
        description: "Monthly Insurance Premium",
        order_id: data.order_id,
        handler: function (response: any) {
          setIsPremiumPaid(true);
        },
        prefill: {
          name: "Ananya Rao",
          email: "customer@demo.com",
          contact: "9999999999"
        },
        theme: {
          color: "#06b6d4" // cyan
        }
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (e) {
      console.error(e);
      alert("Failed to initialize Razorpay checkout");
    }
  }

  return <main className="min-h-screen">
    <TopBar role="Customer portal" onBack={onBack} name="Ananya Rao" initials="AR" />
    <div className="flex">
      <aside className={`${sidebar ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-white/8 bg-navy px-4 py-5 lg:static lg:flex lg:min-h-[calc(100vh-73px)]`}>
        <div className="mb-8 flex items-center justify-between px-2">
          <Logo compact />
          <button className="icon-button lg:hidden" onClick={() => setSidebar(false)}><X size={16} /></button>
        </div>
        <nav className="space-y-1">
          <div className={tab === 'overview' ? 'nav-active' : 'nav-item'} onClick={() => setTab('overview')}><LayoutDashboard size={16} /> Dashboard</div>
          <div className={tab === 'file' ? 'nav-active' : 'nav-item'} onClick={() => setTab('file')}><FileCheck2 size={16} /> File a Claim</div>
          <div className={tab === 'history' ? 'nav-active' : 'nav-item'} onClick={() => setTab('history')}><History size={16} /> My Claims</div>
          <div className={tab === 'billing' ? 'nav-active' : 'nav-item'} onClick={() => setTab('billing')}><CreditCard size={16} /> Billing & Premiums</div>
        </nav>
        
        <div className="mt-auto rounded-2xl border border-white/8 bg-white/5 p-4 text-xs text-slate-400">
          <p>Policy #POL-92841</p>
          <p className="mt-1 font-medium text-white">Comprehensive Coverage</p>
        </div>
        <button className="nav-item mt-4 w-full" onClick={onBack}><LogOut size={16} /> Sign out</button>
      </aside>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8">
          <div><div className="flex items-center gap-3"><button className="icon-button lg:hidden" onClick={() => setSidebar(true)}><Menu size={17} /></button><div><h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Good morning, Ananya</h1></div></div></div>
        </div>

        <div className="p-5 lg:p-8">
          {tab === 'overview' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                 <GlassCard className="p-5">
                   <h3 className="text-sm font-medium text-slate-400">Active Policy</h3>
                   <p className="mt-2 text-xl font-semibold text-white">Comprehensive Auto</p>
                   <p className="mt-1 text-xs text-emerald flex items-center gap-1"><ShieldCheck size={12}/> Valid till Dec 2027</p>
                 </GlassCard>
                 <GlassCard className="p-5">
                   <h3 className="text-sm font-medium text-slate-400">Insured Vehicle</h3>
                   <p className="mt-2 text-xl font-semibold text-white">MH 12 AB 4821</p>
                   <p className="mt-1 text-xs text-slate-500">2023 Tesla Model 3</p>
                 </GlassCard>
                 <GlassCard className="p-5">
                   <h3 className="text-sm font-medium text-slate-400">Total Claims</h3>
                   <p className="mt-2 text-xl font-semibold text-white">{claims.length}</p>
                   <p className="mt-1 text-xs text-slate-500">Filed this year</p>
                 </GlassCard>
              </div>
              <h3 className="text-lg font-medium text-white mt-8 mb-4">Quick Actions</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                 <button onClick={() => setTab('file')} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors text-left">
                   <div>
                     <p className="font-medium text-white flex items-center gap-2"><FileCheck2 size={16} className="text-cyan"/> File a new claim</p>
                     <p className="mt-1 text-xs text-slate-400">Report an accident or damage instantly</p>
                   </div>
                   <ArrowRight size={16} className="text-slate-500" />
                 </button>
                 <button onClick={() => setTab('billing')} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors text-left">
                   <div>
                     <p className="font-medium text-white flex items-center gap-2"><CreditCard size={16} className="text-cyan"/> Pay Premium</p>
                     <p className="mt-1 text-xs text-slate-400">Sept 2026 premium is due in 5 days</p>
                   </div>
                   <ArrowRight size={16} className="text-slate-500" />
                 </button>
              </div>
            </div>
          ) : tab === 'billing' ? (
            <div className="max-w-xl mx-auto mt-10">
              <GlassCard className="p-8 sm:p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan/10 text-cyan mb-6"><CreditCard size={28} /></div>
                <h2 className="text-2xl font-semibold text-white">September 2026 Premium</h2>
                <div className="mt-4 space-y-1">
                  <p className="text-slate-400">Vehicle: <strong className="text-white">MH 12 AB 4821</strong></p>
                  <p className="text-slate-400">Plan: <strong className="text-white">Comprehensive Auto Coverage</strong></p>
                  <p className="text-slate-400">Policy: <strong className="text-white">POL-92841</strong></p>
                </div>
                
                <div className="my-8">
                  <span className="text-5xl font-semibold text-white">₹1,500</span>
                  <span className="text-slate-500 ml-2">/ month</span>
                </div>
                
                {isPremiumPaid ? (
                  <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-5 flex items-center justify-center gap-3 text-emerald font-medium">
                    <BadgeCheck size={24} /> Premium Paid (Thank You!)
                  </div>
                ) : (
                  <button className="primary-button w-full text-lg py-4" onClick={payPremium}>
                    Pay with Razorpay <ArrowRight size={20} className="ml-auto" />
                  </button>
                )}
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck size={14} /> Secured by Razorpay Checkout
                </div>

                <div className="mt-12 border-t border-white/10 pt-8 text-left">
                  <h3 className="text-lg font-medium text-white mb-4">Payment History</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                      <div>
                        <p className="text-sm font-medium text-white">August 2026 Premium</p>
                        <p className="text-xs text-slate-500 mt-0.5">Paid on Aug 1st via Razorpay</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">₹1,500</p>
                        <p className="text-xs text-emerald flex items-center justify-end gap-1 mt-0.5"><Check size={12}/> Successful</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                      <div>
                        <p className="text-sm font-medium text-white">July 2026 Premium</p>
                        <p className="text-xs text-slate-500 mt-0.5">Paid on Jul 2nd via Razorpay</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">₹1,500</p>
                        <p className="text-xs text-emerald flex items-center justify-end gap-1 mt-0.5"><Check size={12}/> Successful</p>
                      </div>
                    </div>
                  </div>
                </div>

              </GlassCard>
            </div>
          ) : tab === 'history' ? (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-semibold tracking-tight text-white">Claim History</h2><p className="mt-1 text-sm text-slate-400">Track the status and AI decisions for your submitted claims.</p></div>
              {loadingHistory ? <p className="text-slate-500">Loading claims...</p> : claims.length === 0 ? <p className="text-slate-500">No claims submitted yet.</p> : (
                <div className="grid gap-4">
                  {claims.map(c => (
                    <GlassCard key={c.id} className="p-6">
                      <div className="flex justify-between items-start border-b border-white/8 pb-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">{c.claimId}</h3>
                          <p className="text-xs text-slate-400 mt-1">Submitted {c.submitted}</p>
                        </div>
                        <Status status={c.status} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Accident Description</p>
                          <p className="text-sm text-slate-300">{c.description}</p>
                        </div>
                        <div className="rounded-lg border border-white/8 bg-white/5 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Decision Context</p>
                          <p className="text-xs text-slate-300 leading-relaxed mb-4">{c.reasoning}</p>
                          {c.status === 'Approved' && (
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-emerald font-medium">
                                <BadgeCheck size={16} /> INR 5,000 Payout
                              </div>
                              <div className={`px-2 py-1 rounded text-xs ${c.payoutStatus === 'Processed' ? 'bg-emerald/20 text-emerald' : c.payoutStatus === 'Processing' ? 'bg-amber/20 text-amber' : 'bg-slate-700 text-slate-400'}`}>
                                {c.payoutStatus || 'Pending'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          ) : stage === 'loading' ? <div className="flex min-h-[65vh] items-center justify-center"><GlassCard className="w-full max-w-lg p-10 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan/10 text-cyan"><Sparkles className="animate-pulse" size={28} /></div><h1 className="mt-7 text-2xl font-semibold text-white">Agentic AI is analyzing your claim...</h1><p className="mt-3 text-sm leading-6 text-slate-400">Reviewing vehicle imagery, policy coverage, and incident details via Gemini API.</p><div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="analysis-bar h-full rounded-full bg-cyan" /></div></GlassCard></div> : stage === 'success' ? <div className="flex min-h-[65vh] items-center justify-center"><GlassCard className="w-full max-w-xl p-8 text-center sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald/12 text-emerald"><Check size={34} /></div><div className="eyebrow mx-auto mt-7 w-fit text-emerald"><BadgeCheck size={14} /> Safe claim verified</div><h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">Claim auto-approved.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">Your claim has been approved and an <strong className="font-medium text-white">INR 5,000 payout</strong> has been initiated via Razorpay.</p><div className="mt-8 rounded-2xl border border-emerald/20 bg-emerald/8 p-4 text-left"><div className="flex items-center justify-between text-sm"><span className="text-slate-400">Claim reference</span><span className="font-mono text-emerald">{values.claim}</span></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-400">Expected credit</span><span className="text-white">Within 2 hours</span></div></div><button className="secondary-button mt-8 w-full" onClick={() => {setStage('form'); setValues({ ...values, claim: 'CLM-' + Math.floor(1000 + Math.random() * 9000), description: '' }); setFile(null);}}>File another claim</button></GlassCard></div> : <><div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow"><FileCheck2 size={14} /> Customer portal</div><h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">File a new claim</h2><p className="mt-2 text-sm text-slate-400">Tell us what happened. Our AI will handle the first review.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald" /> Secure and encrypted</div></div><div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><GlassCard className="p-6 sm:p-8"><div className="mb-7 flex items-center justify-between"><div><h2 className="font-medium text-white">Incident details</h2><p className="mt-1 text-xs text-slate-500">All fields are required for accurate triage.</p></div><span className="step-pill">1 of 2</span></div><div className="grid gap-5 sm:grid-cols-2"><label className="field-label">Full name<input className="field-input" placeholder="e.g. Ananya Rao" value={values.name} onChange={setField('name')} /></label><label className="field-label">Policy / claim ID<input className="field-input" placeholder="e.g. POL-92841" value={values.claim} onChange={setField('claim')} /></label><label className="field-label sm:col-span-2">Vehicle registration number<input className="field-input" placeholder="e.g. MH 12 AB 4821" value={values.vehicle} onChange={setField('vehicle')} /></label><div className="sm:col-span-2"><label className="field-label flex items-center justify-between">Accident description <button onClick={toggleListening} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${listening ? 'bg-coral text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}><Mic size={12}/> {listening ? 'Listening...' : 'Speak'}</button></label><textarea className="field-input min-h-32 resize-none mt-2" placeholder='Describe when and how the damage occurred... Try "minor scratch" for auto-pay or "completely totaled" for investigation.' value={values.description} onChange={setField('description')} /></div></div></GlassCard><GlassCard className="flex flex-col p-6 sm:p-8"><div className="mb-7"><h2 className="font-medium text-white">Damage photos</h2><p className="mt-1 text-xs text-slate-500">Upload clear photos of the affected area.</p></div><label className={`drop-zone flex flex-1 cursor-pointer flex-col items-center justify-center text-center ${dragging ? 'drop-zone-active' : ''}`} onDragOver={(e: DragEvent) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files) }}><input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files)} />{file ? <><FileImage size={30} className="text-cyan" /><p className="mt-4 max-w-full truncate px-4 text-sm text-white">{file.name}</p><p className="mt-1 text-xs text-emerald">Photo ready to analyze</p></> : <><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan"><UploadCloud size={22} /></div><p className="mt-4 text-sm text-white">Drop photos here or <span className="text-cyan">browse</span></p><p className="mt-2 text-xs text-slate-500">PNG, JPG up to 10MB</p></>}</label><button className="primary-button mt-6 w-full" onClick={submit}><Sparkles size={17} /> Submit for AI review <ArrowRight size={16} className="ml-auto" /></button></GlassCard></div></>}
        </div>
      </div>
    </div>
  </main>
}

function Agent({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<AgentTab>('overview')
  const [claims, setClaims] = useState<Claim[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sidebar, setSidebar] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/claims')
      .then(res => res.json())
      .then((data: Claim[]) => {
        setClaims(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedId]);

  const pending = claims.filter((claim) => claim.status === 'Pending Review' || claim.status === 'Flagged').length
  const autoPaid = claims.filter((claim) => claim.status === 'Approved').length
  const flagged = claims.filter((claim) => claim.status === 'Flagged').length

  const filteredClaims = tab === 'investigations' ? claims.filter(c => c.status !== 'Approved') : (tab === 'payouts' ? claims.filter(c => c.status === 'Approved') : claims)
  
  const validSelectedId = filteredClaims.find(c => c.id === selectedId) ? selectedId : (filteredClaims[0]?.id || null)
  const selected = filteredClaims.find((claim) => claim.id === validSelectedId)

  const updateStatus = async (status: ClaimStatus) => {
    if (!selected) return;
    try {
      await fetch(`http://localhost:3001/api/claims/${selected.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setClaims(claims.map((claim) => claim.id === selected.id ? { ...claim, status, payoutStatus: 'Processing' } : claim));
      if (status === 'Approved') {
        alert("Claim manually approved. Razorpay payout initiated!");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating status.");
    }
  }

  const triggerWebhook = async (id: string) => {
    try {
      await fetch('http://localhost:3001/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: id, event: 'payout.processed' })
      });
      setClaims(claims.map(c => c.id === id ? { ...c, payoutStatus: 'Processed' } : c));
      alert("Simulated Razorpay webhook received! Status is now Processed.");
    } catch (e) { console.error(e) }
  }

  const downloadPDF = () => {
    if (!selected) return;
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("OIE-ClaimGuard Audit Report", 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Claim ID: ${selected.claimId}`, 20, 40);
      doc.text(`Customer: ${selected.name}`, 20, 50);
      doc.text(`Vehicle: ${selected.vehicle}`, 20, 60);
      doc.text(`Status: ${selected.status}`, 20, 70);
      doc.text(`Risk Score: ${selected.risk}%`, 20, 80);
      doc.text(`Payout Status: ${selected.payoutStatus || 'N/A'}`, 20, 90);
      
      doc.text("AI Reasoning:", 20, 110);
      const splitText = doc.splitTextToSize(selected.reasoning, 170);
      doc.text(splitText, 20, 120);
      
      doc.save(`ClaimReport_${selected.claimId}.pdf`);
    });
  }

  return <main className="min-h-screen"><TopBar role="Investigator workspace" onBack={onBack} name="Alex Kumar" initials="AK" /><div className="flex"><aside className={`${sidebar ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-white/8 bg-navy px-4 py-5 lg:static lg:flex lg:min-h-[calc(100vh-73px)]`}><div className="mb-8 flex items-center justify-between px-2"><Logo compact /><button className="icon-button lg:hidden" onClick={() => setSidebar(false)}><X size={16} /></button></div>
    
    <nav className="space-y-1">
      <div className={tab === 'overview' ? 'nav-active' : 'nav-item'} onClick={() => setTab('overview')}><LayoutDashboard size={16} /> Overview</div>
      <div className={tab === 'investigations' ? 'nav-active' : 'nav-item'} onClick={() => setTab('investigations')}><ClipboardCheck size={16} /> Investigations <span className="ml-auto badge-count">{pending}</span></div>
      <div className={tab === 'analytics' ? 'nav-active' : 'nav-item'} onClick={() => setTab('analytics')}><BarChart3 size={16} /> Analytics</div>
      <div className={tab === 'payouts' ? 'nav-active' : 'nav-item'} onClick={() => setTab('payouts')}><FileCheck2 size={16} /> Payouts</div>
    </nav>
    
    <div className="mt-auto rounded-2xl border border-cyan/15 bg-cyan/5 p-4"><div className="flex items-center gap-2 text-xs font-medium text-cyan"><Gauge size={15} /> AI health</div><p className="mt-3 text-xs leading-5 text-slate-400">All systems operational. Triage engine is processing normally via Gemini API.</p><div className="mt-3 h-1 rounded-full bg-white/8"><div className="h-full w-[94%] rounded-full bg-cyan" /></div></div><button className="nav-item mt-4 w-full" onClick={onBack}><LogOut size={16} /> Sign out</button></aside><div className="min-w-0 flex-1"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8"><div><div className="flex items-center gap-3"><button className="icon-button lg:hidden" onClick={() => setSidebar(true)}><Menu size={17} /></button><div><div className="eyebrow hidden sm:flex"><Gauge size={14} /> Operations overview</div><h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">Good morning, Agent</h1></div></div></div><button className="secondary-button hidden sm:flex"><Bell size={15} /> Alerts <span className="badge-count">{flagged}</span></button></div>
    
    <div className="p-5 lg:p-8">
      {tab === 'analytics' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">System Analytics</h2>
          <div className="grid gap-4 sm:grid-cols-3">
             <Metric icon={Clock3} label="Avg Resolution Time" value="4.2s" trend="-12% vs last week" positive />
             <Metric icon={ShieldCheck} label="AI Accuracy Score" value="98.7%" trend="Stable" positive />
             <Metric icon={AlertTriangle} label="Fraud Blocked (INR)" value="₹12.4M" trend="+1.2M this month" positive />
          </div>
          <GlassCard className="p-10 text-center flex flex-col items-center justify-center border border-dashed border-white/20">
             <BarChart3 size={40} className="text-slate-600 mb-4" />
             <p className="text-slate-400">Detailed charts and historic data visualizations will appear here in production.</p>
          </GlassCard>
        </div>
      ) : tab === 'payouts' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Processed Payouts (Razorpay)</h2>
          <GlassCard className="p-6">
             {autoPaid === 0 ? <p className="text-slate-500">No approved payouts yet.</p> : (
               <table className="w-full text-left text-sm text-slate-300">
                 <thead>
                   <tr className="border-b border-white/10 text-slate-500">
                     <th className="pb-3 font-medium">Claim ID</th>
                     <th className="pb-3 font-medium">Customer</th>
                     <th className="pb-3 font-medium">Payout Status</th>
                     <th className="pb-3 font-medium text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {filteredClaims.map(c => (
                     <tr key={c.id}>
                       <td className="py-4 font-medium text-white">{c.claimId}</td>
                       <td className="py-4">{c.name}</td>
                       <td className="py-4">
                         <span className={`px-2 py-1 rounded text-xs ${c.payoutStatus === 'Processed' ? 'bg-emerald/20 text-emerald' : 'bg-amber/20 text-amber'}`}>
                           {c.payoutStatus || 'Processing'}
                         </span>
                       </td>
                       <td className="py-4 text-right">
                         {c.payoutStatus !== 'Processed' && (
                           <button onClick={() => triggerWebhook(c.id)} className="text-[11px] font-medium text-cyan hover:text-white transition-colors bg-cyan/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1"><Zap size={12}/> Simulate Webhook</button>
                         )}
                         {c.payoutStatus === 'Processed' && <span className="text-[11px] text-slate-500">Webhook Received</span>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </GlassCard>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={ClipboardCheck} label="Total claims" value={claims.length.toString()} trend="Live data" /><Metric icon={BadgeCheck} label="Auto-paid claims" value={autoPaid.toString()} trend="Live data" positive /><Metric icon={Clock3} label="Pending investigations" value={pending.toString().padStart(2, '0')} trend="Needs attention" /><Metric icon={AlertTriangle} label="Suspected fraud" value={flagged.toString()} trend="Live data" danger /></div>
          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]"><GlassCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/8 px-5 py-5"><div><h2 className="font-medium text-white">{tab === 'overview' ? 'All Claims' : 'Investigations Queue'}</h2><p className="mt-1 text-xs text-slate-500">{tab === 'investigations' ? 'AI-routed claims requiring manual review' : 'Complete live feed of all claims'}</p></div><span className="step-pill">{filteredClaims.length} items</span></div><div className="divide-y divide-white/6 h-[600px] overflow-y-auto">{filteredClaims.map((claim) => <button key={claim.id} onClick={() => setSelectedId(claim.id)} className={`claim-row w-full text-left ${claim.id === selected?.id ? 'claim-row-active' : ''}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="avatar avatar-sm">{claim.name.split(' ').map((part) => part[0]).join('')}</div><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{claim.name}</p><p className="mt-1 text-xs text-slate-500">{claim.claimId} · {claim.submitted}</p></div></div><Status status={claim.status} /></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-500">Risk score</span><span className={claim.risk > 75 ? 'text-coral' : claim.risk > 40 ? 'text-amber' : 'text-emerald'}>{claim.risk}%</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${claim.risk > 75 ? 'bg-coral' : claim.risk > 40 ? 'bg-amber' : 'bg-emerald'}`} style={{ width: `${claim.risk}%` }} /></div></button>)}</div></GlassCard>
          
          {filteredClaims.length === 0 ? (
            <GlassCard className="p-5 sm:p-7 flex items-center justify-center">
              <p className="text-slate-500">{loading ? "Loading claims from backend..." : "No claims match this filter."}</p>
            </GlassCard>
          ) : selected ? (
            <GlassCard className="p-5 sm:p-7"><div className="flex flex-col justify-between gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="eyebrow">Claim detail</span><Status status={selected.status} /></div><h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{selected.claimId}</h2><p className="mt-1 text-sm text-slate-400">Submitted {selected.submitted} by {selected.name}</p></div></div><div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]"><div><div className="damage-image"><img src={selected.image} alt="Uploaded vehicle damage evidence" /><div className="image-label"><ImagePlus size={14} /> Evidence image</div></div><div className="mt-4 grid grid-cols-3 gap-2"><Info label="Customer" value={selected.name} /><Info label="Vehicle no." value={selected.vehicle} /><Info label="Policy" value="Comprehensive" /></div><div className="mt-4"><Info label="Customer Description" value={selected.description} /></div></div><div><div className="flex items-center justify-between"><h3 className="font-medium text-white">AI triage report</h3><div className="flex items-center gap-2"><button onClick={downloadPDF} className="flex items-center gap-1 text-[11px] text-cyan hover:text-white px-2 py-1 rounded border border-cyan/30 transition-colors"><Download size={12}/> PDF Audit</button><span className={`risk-pill ${selected.risk > 75 ? 'risk-high' : selected.risk > 40 ? 'risk-medium' : 'risk-low'}`}><Gauge size={13} /> {selected.risk}% risk</span></div></div><div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-5"><p className="text-sm leading-6 text-slate-300">{selected.reasoning}</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="report-stat"><span>Visual match</span><strong>{selected.risk > 75 ? 'Low' : 'High'}</strong></div><div className="report-stat"><span>Policy coverage</span><strong className="text-emerald">Active</strong></div></div></div><div className="mt-5 flex flex-col gap-3 sm:flex-row">{selected.status === 'Pending Review' || selected.status === 'Flagged' ? <><button className="approve-button flex-1" onClick={() => updateStatus('Approved')}><BadgeCheck size={16} /> Approve & payout</button><button className="reject-button flex-1" onClick={() => updateStatus('Flagged')}><AlertTriangle size={16} /> Reject & flag</button></> : <div className="rounded border border-emerald/20 bg-emerald/10 p-3 w-full flex items-center justify-center gap-2 text-sm text-emerald"><BadgeCheck size={16} /> Payout Initiated via Razorpay <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${selected.payoutStatus === 'Processed' ? 'bg-emerald/20 text-emerald' : 'bg-amber/20 text-amber'}`}>{selected.payoutStatus || 'Processing'}</span></div>}</div></div></div></GlassCard>
          ) : null}
          </div>
        </>
      )}
      </div></div></div></main>
}

function Metric({ icon: Icon, label, value, trend, positive, danger }: { icon: typeof Gauge; label: string; value: string; trend: string; positive?: boolean; danger?: boolean }) { return <GlassCard className="p-5"><div className="flex items-start justify-between"><div className="metric-icon"><Icon size={17} /></div><span className={`text-[11px] ${danger ? 'text-coral' : positive ? 'text-emerald' : 'text-slate-500'}`}>{trend}</span></div><p className="mt-5 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</p></GlassCard> }
function Status({ status }: { status: ClaimStatus }) { return <span className={`status status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span> }
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-300 leading-relaxed">{value}</p></div> }

export default function Page() {
  const [role, setRole] = useState<Role>('login')
  const content = useMemo(() => role === 'customer' ? <Customer onBack={() => setRole('login')} /> : role === 'agent' ? <Agent onBack={() => setRole('login')} /> : <Login onSelect={setRole} />, [role])
  return content
}
