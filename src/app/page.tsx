'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-4xl w-full text-center">
        {/* Logo Section */}
        <img 
          src="https://zypgkofidbmjpohzvwgt.supabase.co/storage/v1/object/public/public_assets/logo.png" 
          className="h-24 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
          alt="Crypverify" 
        />
        
        <h1 className="text-7xl font-black uppercase italic tracking-tighter mb-4">
          Identity <span className="text-blue-500 underline decoration-8">Verified.</span>
        </h1>
        <p className="text-xl font-bold text-slate-400 mb-12 uppercase tracking-widest">
          Secure Blockchain Document Processing System
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Submit Button */}
          <Link href="/submit" className="group text-left">
            <div className="bg-blue-600 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-none group-hover:translate-x-2 group-hover:translate-y-2 transition-all h-full cursor-pointer">
              <h2 className="text-3xl font-black uppercase italic mb-2">Submit Docs</h2>
              <p className="font-bold text-sm text-blue-200 uppercase tracking-widest">Verification Form</p>
            </div>
          </Link>

          {/* Receipts Button - Pointing to your new Netlify site */}
          <a href="https://crypverify-receipts.netlify.app" target="_blank" className="group text-left">
            <div className="bg-white text-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] group-hover:shadow-none group-hover:translate-x-2 group-hover:translate-y-2 transition-all h-full cursor-pointer">
              <h2 className="text-3xl font-black uppercase italic mb-2">Receipts</h2>
              <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Verify Payments</p>
            </div>
          </a>
        </div>

        {/* Small Review Queue Link at the bottom */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <Link href="/admin" className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 hover:text-blue-400 transition-colors underline decoration-dotted underline-offset-4">
            Review Queue Login
          </Link>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">
            Encrypted • Decentralized • Crypverify v2.0
          </div>
        </div>
      </div>
    </div>
  )
}