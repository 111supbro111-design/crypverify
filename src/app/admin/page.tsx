'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import emailjs from '@emailjs/browser'
import { Loader2, TrendingUp, ShieldCheck, Trash2, Check, XCircle, AlertTriangle, Bell } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [submissions, setSubmissions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // --- NEW UI STATES ---
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const SERVICE_ID = 'service_lxutvlm' 
  const TEMPLATE_ID = 'template_3we83jq'
  const PUBLIC_KEY = 'SNrykwOU7qlIt0y8w' 
  const ADMIN_PASSWORD = 'YourSecurePassword123' 

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (session === 'active') setAuthorized(true)
    emailjs.init(PUBLIC_KEY)
  }, [])

  useEffect(() => {
    if (authorized) fetchSubmissions()
  }, [authorized])

  const triggerToast = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  async function fetchSubmissions() {
    setRefreshing(true)
    const { data, error } = await supabase.from('verifications').select('*').order('created_at', { ascending: false })
    if (!error) setSubmissions(data)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    const { error } = await supabase.from('verifications').update({ status: newStatus }).eq('id', item.id)
    if (!error) {
      const templateParams = { user_name: item.full_name, user_email: item.email, status: newStatus, ref_id: item.reference_id }
      emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
        .then(() => {
          triggerToast(`${item.full_name} notified of ${newStatus}`, 'success')
          fetchSubmissions()
        })
        .catch((err) => triggerToast("Email system delayed", 'error'))
    }
  }

  const confirmPurge = async () => {
    if (!itemToDelete) return
    const { error } = await supabase.from('verifications').delete().eq('id', itemToDelete)
    if (!error) {
      triggerToast("Record permanently deleted", 'success')
      setItemToDelete(null)
      fetchSubmissions()
    }
  }

  const getImageUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/verification_docs/${path}`

  const filteredSubmissions = submissions.filter(s => 
    s.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-black">
        <form onSubmit={(e) => { e.preventDefault(); if (password === ADMIN_PASSWORD) { setAuthorized(true); localStorage.setItem('admin_session', 'active'); } else { triggerToast('Access Denied', 'error'); } }} 
              className="bg-white border-[6px] border-black p-10 shadow-[12px_12px_0px_0px_white] max-w-sm w-full font-sans">
          <h1 className="text-3xl font-black mb-6 uppercase italic tracking-tighter">Crypverify Admin</h1>
          <input type="password" placeholder="Password" className="w-full p-4 border-4 border-black mb-4 font-black text-xl outline-none" onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 text-white p-4 font-black uppercase text-xl border-4 border-black shadow-[4px_4px_0px_0px_black]">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans text-black relative overflow-x-hidden">
      
      {/* 🟢 CUSTOM IN-SITE TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 border-4 border-black shadow-[6px_6px_0px_0px_black] font-black uppercase italic animate-in slide-in-from-bottom-10 duration-300 ${
          notification.type === 'success' ? 'bg-green-400' : 'bg-red-500 text-white'
        }`}>
          <Bell size={20} />
          {notification.msg}
        </div>
      )}

      {/* 🔴 CUSTOM IN-SITE PURGE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-[6px] border-black p-8 max-w-sm w-full shadow-[15px_15px_0px_0px_#ef4444]">
            <AlertTriangle size={48} className="text-red-600 mb-4" />
            <h2 className="text-2xl font-black uppercase italic mb-2">Confirm Purge?</h2>
            <p className="font-bold text-xs text-slate-500 mb-6 uppercase leading-tight">This action will erase the documents and blockchain records from our vault forever.</p>
            <div className="flex gap-4">
              <button onClick={confirmPurge} className="flex-1 bg-red-600 text-white py-3 font-black border-4 border-black uppercase shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none">Delete</button>
              <button onClick={() => setItemToDelete(null)} className="flex-1 bg-slate-200 text-black py-3 font-black border-4 border-black uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b-[8px] border-black pb-8 gap-6">
          <div className="flex items-center gap-4">
             <img src="https://zypgkofidbmjpohzvwgt.supabase.co/storage/v1/object/public/public_assets/logo.png" className="h-12 w-auto" alt="logo" />
             <h1 className="text-5xl font-black uppercase italic tracking-tighter text-black">Review Queue</h1>
          </div>
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Search REF or NAME..." className="p-4 border-4 border-black font-black shadow-[4px_4px_0px_0px_black] outline-none focus:bg-yellow-100 text-black" onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex justify-between">
                <button onClick={fetchSubmissions} className="text-[10px] font-black uppercase hover:underline text-black">{refreshing ? 'Syncing...' : '↻ Refresh Data'}</button>
                <button onClick={() => { localStorage.removeItem('admin_session'); setAuthorized(false); }} className="text-[10px] font-black uppercase text-red-600 hover:underline italic">Logout</button>
            </div>
          </div>
        </div>

        <div className="grid gap-12">
          {filteredSubmissions.map((item) => (
            <SubmissionCard 
              key={item.id} 
              item={item} 
              getImageUrl={getImageUrl} 
              handleUpdateStatus={handleUpdateStatus} 
              setItemToDelete={setItemToDelete} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SubmissionCard({ item, getImageUrl, handleUpdateStatus, setItemToDelete }: any) {
  const [audit, setAudit] = useState<any>(null)
  const [isAuditing, setIsAuditing] = useState(false)

  useEffect(() => {
    async function performAudit() {
      if (!item.tx_hash) return
      setIsAuditing(true)
      try {
        const hash = item.tx_hash.trim()
        const isEth = hash.startsWith('0x')
        const coinId = isEth ? 'ethereum' : 'bitcoin'
        const pRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
        const pData = await pRes.json()
        const price = pData[coinId].usd
        let amount = 0
        if (isEth) {
          const res = await fetch('https://eth-mainnet.g.alchemy.com/v2/RYP7UNwfgvPgVasAzO8NC', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionByHash", params: [hash], id: 1 })
          })
          const data = await res.json()
          amount = parseInt(data.result.value, 16) / 1e18
        } else {
          const res = await fetch(`https://api.blockcypher.com/v1/btc/main/txs/${hash}`)
          const data = await res.json()
          amount = data.total / 1e8
        }
        setAudit({ symbol: isEth ? 'ETH' : 'BTC', amount: amount.toFixed(isEth ? 4 : 6), usdValue: (amount * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) })
      } catch (e) { console.error("Audit fail") }
      setIsAuditing(false)
    }
    performAudit()
  }, [item.tx_hash])

  return (
    <div className="bg-white border-[5px] border-black shadow-[12px_12px_0px_0px_black] text-black">
      <div className="bg-black text-white p-5 flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase italic">{item.full_name}</h2>
        <div className="flex items-center gap-3">
          <span className="bg-yellow-400 text-black px-3 py-1 font-black uppercase text-xs border-2 border-black tracking-widest">REF: {item.reference_id}</span>
          <span className={`px-3 py-1 font-black uppercase text-xs border-2 border-white ${item.status === 'APPROVED' ? 'bg-green-500' : item.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-500'}`}>
            {item.status}
          </span>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 border-4 border-black">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">User Contact</p>
            <p className="text-2xl font-black text-blue-600 mb-4">{item.email}</p>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Transaction Hash</p>
            <p className="font-bold text-xs break-all border-2 border-black p-2 bg-white text-black font-mono">{item.tx_hash}</p>
          </div>

          <div className="bg-blue-600 text-white p-5 border-4 border-black shadow-[6px_6px_0px_0px_black] flex flex-col justify-center relative overflow-hidden">
            <TrendingUp size={48} className="absolute right-2 top-2 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 underline italic text-blue-100">Live On-Chain Audit</p>
            {isAuditing ? (
              <div className="flex items-center gap-2 animate-pulse font-black italic">
                <Loader2 className="animate-spin" size={20} /> Verifying Ledger...
              </div>
            ) : audit ? (
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-4xl font-black tracking-tighter">{audit.amount} {audit.symbol}</p>
                  <p className="text-[9px] font-bold uppercase text-blue-200 tracking-widest">Confirmed Total</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-yellow-300">{audit.usdValue}</p>
                  <p className="text-[9px] font-bold uppercase text-blue-200 tracking-widest italic">Current Value</p>
                </div>
              </div>
            ) : <p className="text-sm font-black uppercase text-red-200 italic">Audit Link Error</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-black">
          {[ { label: 'ID CARD', path: item.id_url }, { label: 'SELFIE', path: item.selfie_url }, { label: 'RECEIPT', path: item.receipt_url } ].map((img, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-black mb-2 uppercase">{img.label}</p>
              <a href={getImageUrl(img.path)} target="_blank" rel="noreferrer">
                <img src={getImageUrl(img.path)} className="w-full h-64 object-cover border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none transition-all" alt={img.label} />
              </a>
            </div>
          ))}
        </div>

        <div className="border-t-4 border-black pt-6 flex justify-between items-center">
          <div className="flex gap-4">
            <button onClick={() => handleUpdateStatus(item, 'APPROVED')} className="bg-green-500 text-black px-8 py-3 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2">
              <Check size={18} /> Approve
            </button>
            <button onClick={() => handleUpdateStatus(item, 'REJECTED')} className="bg-orange-500 text-black px-8 py-3 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2">
              <XCircle size={18} /> Reject
            </button>
          </div>
          {/* PURGE BUTTON TRIGGERS SITE-MODAL */}
          <button onClick={() => setItemToDelete(item.id)} className="bg-red-600 text-white px-4 py-2 font-black uppercase text-[10px] border-2 border-black flex items-center gap-2 hover:bg-red-700 transition-colors">
            <Trash2 size={14} /> Purge
          </button>
        </div>
      </div>
    </div>
  )
}