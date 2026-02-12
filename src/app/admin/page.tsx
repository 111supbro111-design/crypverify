'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import emailjs from '@emailjs/browser'

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

  // 🔑 YOUR FINAL KEYS
  const SERVICE_ID = 'service_lxutvlm' 
  const TEMPLATE_ID = 'template_3we83jq'
  const PUBLIC_KEY = 'SNrykwOU7qlIt0y8w' 

  const ADMIN_PASSWORD = 'YourSecurePassword123' // Change this to your preferred admin password

  useEffect(() => {
    // 1. Check if already logged in
    const session = localStorage.getItem('admin_session')
    if (session === 'active') setAuthorized(true)
    
    // 2. Initialize EmailJS library
    emailjs.init(PUBLIC_KEY)
  }, [])

  useEffect(() => {
    if (authorized) fetchSubmissions()
  }, [authorized])

  async function fetchSubmissions() {
    setRefreshing(true)
    const { data, error } = await supabase.from('verifications').select('*').order('created_at', { ascending: false })
    if (!error) setSubmissions(data)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    // Update Supabase Database
    const { error } = await supabase.from('verifications').update({ status: newStatus }).eq('id', item.id)
    
    if (!error) {
      // Data to send to your EmailJS Template
      const templateParams = {
        user_name: item.full_name,
        user_email: item.email, 
        status: newStatus,
        ref_id: item.reference_id
      }

      // Fire the email
      emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
        .then(() => {
          alert(`SUCCESS: ${item.full_name} has been notified via email!`)
          fetchSubmissions()
        })
        .catch((err) => {
          console.error("EmailJS Error:", err)
          alert("Database updated, but email failed. Ensure the 'To Email' in your template is {{user_email}}")
        })
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("PERMANENTLY DELETE THIS RECORD?")) {
      await supabase.from('verifications').delete().eq('id', id)
      fetchSubmissions()
    }
  }

  const getImageUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/verification_docs/${path}`
  }

  const filteredSubmissions = submissions.filter(s => 
    s.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-black">
        <form onSubmit={(e) => { e.preventDefault(); if (password === ADMIN_PASSWORD) { setAuthorized(true); localStorage.setItem('admin_session', 'active'); } else { alert('Access Denied'); } }} 
              className="bg-white border-[6px] border-black p-10 shadow-[12px_12px_0px_0px_white] max-w-sm w-full font-sans">
          <h1 className="text-3xl font-black mb-6 uppercase italic tracking-tighter">Crypverify Admin</h1>
          <input type="password" placeholder="Password" 
            className="w-full p-4 border-4 border-black mb-4 font-black text-xl outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white p-4 font-black uppercase text-xl border-4 border-black shadow-[4px_4px_0px_0px_black]">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b-[8px] border-black pb-8 gap-6">
          <div className="flex items-center gap-4 text-black">
             <img src="https://zypgkofidbmjpohzvwgt.supabase.co/storage/v1/object/public/public_assets/logo.png" className="h-12 w-auto" alt="logo" />
             <h1 className="text-5xl font-black uppercase italic tracking-tighter">Queue</h1>
          </div>
          <div className="flex flex-col gap-2">
            <input 
                type="text" 
                placeholder="Search REF or NAME..." 
                className="p-4 border-4 border-black font-black shadow-[4px_4px_0px_0px_black] outline-none focus:bg-yellow-100 text-black"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex justify-between">
                <button onClick={fetchSubmissions} className="text-[10px] font-black uppercase hover:underline text-black">{refreshing ? 'Syncing...' : '↻ Refresh Data'}</button>
                <button onClick={() => { localStorage.removeItem('admin_session'); setAuthorized(false); }} className="text-[10px] font-black uppercase text-red-600 hover:underline italic">Logout</button>
            </div>
          </div>
        </div>

        <div className="grid gap-12 text-black">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center p-20 border-4 border-dashed border-black opacity-30 font-black uppercase">No Pending Requests Found</div>
          ) : (
            filteredSubmissions.map((item) => (
              <div key={item.id} className="bg-white border-[5px] border-black shadow-[12px_12px_0px_0px_black]">
                <div className="bg-black text-white p-5 flex justify-between items-center">
                  <h2 className="text-2xl font-black uppercase italic">{item.full_name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="bg-yellow-400 text-black px-3 py-1 font-black uppercase text-xs border-2 border-black">REF: {item.reference_id}</span>
                    <span className={`px-3 py-1 font-black uppercase text-xs border-2 border-white ${item.status === 'APPROVED' ? 'bg-green-500' : item.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-500'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 border-4 border-black">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500">User Contact</p>
                      <p className="text-2xl font-black text-blue-600 mb-4">{item.email}</p>
                      <p className="text-[10px] font-black uppercase text-slate-500">Transaction Hash</p>
                      <p className="font-bold text-xs break-all border-2 border-black p-2 bg-white text-black">{item.tx_hash}</p>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                       <p className="text-[10px] font-black uppercase opacity-30 italic text-black">Received: {new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                      { label: 'ID CARD', path: item.id_url },
                      { label: 'SELFIE', path: item.selfie_url },
                      { label: 'RECEIPT', path: item.receipt_url }
                    ].map((img, idx) => (
                      <div key={idx}>
                        <p className="text-[10px] font-black mb-2 uppercase text-black">{img.label}</p>
                        <a href={getImageUrl(img.path)} target="_blank" rel="noreferrer">
                          <img src={getImageUrl(img.path)} className="w-full h-64 object-cover border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none transition-all" alt={img.label} />
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-4 border-black pt-6 flex justify-between items-center">
                    <div className="flex gap-4">
                      <button onClick={() => handleUpdateStatus(item, 'APPROVED')} className="bg-green-500 text-black px-8 py-3 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-1 transition-all">Approve</button>
                      <button onClick={() => handleUpdateStatus(item, 'REJECTED')} className="bg-orange-500 text-black px-8 py-3 font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-1 transition-all">Reject</button>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-600 text-white px-4 py-2 font-black uppercase text-[10px] border-2 border-black">Purge Record</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}