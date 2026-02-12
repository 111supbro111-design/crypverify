'use client'
import { useState, ChangeEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CustomerPortal() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [previews, setPreviews] = useState<{ [key: string]: string }>({})
  const [refId, setRefId] = useState('')

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name
    const file = e.target.files?.[0]
    if (file) setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('uploading')
    const formData = new FormData(e.currentTarget)
    const generatedRef = Math.random().toString(36).substr(2, 9).toUpperCase()
    
    try {
      const upload = async (file: File, folder: string) => {
        const fileName = `${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage.from('verification_docs').upload(`${folder}/${fileName}`, file)
        if (error) throw error
        return data.path
      }

      const idPath = await upload(formData.get('idFile') as File, 'ids')
      const selfiePath = await upload(formData.get('selfieFile') as File, 'selfies')
      const receiptPath = await upload(formData.get('receiptFile') as File, 'receipts')

      const { error: dbError } = await supabase.from('verifications').insert({
        full_name: formData.get('fullName'),
        email: formData.get('email'),
        tx_hash: formData.get('txHash'),
        reference_id: generatedRef,
        id_url: idPath,
        selfie_url: selfiePath,
        receipt_url: receiptPath,
        status: 'PENDING'
      })

      if (dbError) throw dbError
      setRefId(generatedRef)
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6 text-black">
        <div className="max-w-md w-full text-center border-8 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-7xl mb-4 text-green-500">✔</div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-black">Verification Logged</h2>
          <div className="my-8 border-y-4 border-black py-4">
            <p className="text-xs font-black uppercase text-gray-500">Your Support Reference</p>
            <p className="text-3xl font-black text-blue-600 tracking-widest">{refId}</p>
          </div>
          <p className="font-bold text-sm uppercase mb-6 text-black">We will email you once reviewed.</p>
          <Link href="/" className="inline-block bg-black text-white px-8 py-3 font-black uppercase text-sm border-2 border-black hover:bg-gray-800">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 flex flex-col items-center justify-center text-black">
      {/* Back navigation */}
      <Link href="/" className="mb-8 font-black uppercase text-xs hover:underline flex items-center gap-2 group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Main Portal
      </Link>

      <div className="max-w-xl w-full bg-white border-[6px] border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black p-6 text-white text-center border-b-[6px] border-black">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Submit Identity Records</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-black uppercase border-b-4 border-black pb-1 italic text-blue-600">01. Identity Info</h3>
            <input name="fullName" type="text" required placeholder="Legal Full Name" className="w-full p-4 border-4 border-black font-black outline-none focus:bg-yellow-50 placeholder:text-gray-300 text-black" />
            <input name="email" type="email" required placeholder="Email Address" className="w-full p-4 border-4 border-black font-black outline-none focus:bg-yellow-50 placeholder:text-gray-300 text-black" />
            <input name="txHash" type="text" required placeholder="TXID / Transaction Hash" className="w-full p-4 border-4 border-black font-black outline-none focus:bg-yellow-50 placeholder:text-gray-300 text-black" />
          </div>

          <div className="space-y-4">
            <h3 className="font-black uppercase border-b-4 border-black pb-1 italic text-blue-600">02. Required Photos</h3>
            {[
              { label: 'Front of ID Card', name: 'idFile' },
              { label: 'Live Selfie Check', name: 'selfieFile' },
              { label: 'Proof of Payment', name: 'receiptFile' }
            ].map((field) => (
              <div key={field.name} className="flex items-center space-x-4 border-4 border-black p-3 bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase block mb-1 text-black">{field.label}</label>
                  <input name={field.name} type="file" accept="image/*" capture="environment" required onChange={handleFileChange}
                    className="text-xs font-black file:bg-black file:text-white file:border-0 file:px-3 file:py-1 file:uppercase file:mr-2 file:cursor-pointer text-black" />
                </div>
                {previews[field.name] && <img src={previews[field.name]} className="h-14 w-14 border-2 border-black object-cover bg-white" alt="preview" />}
              </div>
            ))}
          </div>

          <button type="submit" disabled={status === 'uploading'} className="w-full bg-blue-600 text-white font-black py-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase text-2xl italic">
            {status === 'uploading' ? 'Encrypting & Sending...' : 'Submit Documents'}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-[10px] font-black uppercase text-slate-400">Secure end-to-end verification powered by Crypverify</p>
    </div>
  )
}