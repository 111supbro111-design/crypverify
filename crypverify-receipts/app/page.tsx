'use client'
import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { ShieldCheck, Receipt, Lock, CheckCircle, ExternalLink, Loader2, Globe, ArrowRight, X, Coins, Clock } from 'lucide-react'

export default function ProfessionalValidator() {
  const [txHash, setTxHash] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [passInput, setPassInput] = useState('')
  
  // Rate Limit & Cache Protection
  const [isCooldown, setIsCooldown] = useState(false)
  const priceCache = useRef<{ [key: string]: { price: number, time: number } }>({})

  const [adminCoin, setAdminCoin] = useState('ETH')
  const [adminAmt, setAdminAmt] = useState('')
  const [adminHash, setAdminHash] = useState('')

  const getLivePrice = async (coin: string) => {
    const now = Date.now()
    // If we fetched this price less than 60 seconds ago, use the cache
    if (priceCache.current[coin] && (now - priceCache.current[coin].time < 60000)) {
      return priceCache.current[coin].price
    }

    try {
      const id = coin === 'ETH' ? 'ethereum' : 'bitcoin'
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`)
      const data = await res.json()
      const price = data[id].usd
      priceCache.current[coin] = { price, time: now }
      return price
    } catch (e) {
      return coin === 'ETH' ? 2750 : 96000 // Professional "Safety" Fallback
    }
  }

  const validateOnChain = async () => {
    const hash = txHash.trim()
    if (!hash || isCooldown) return
    
    setIsValidating(true)
    setIsCooldown(true) // Start cooldown
    setReceiptData(null)

    try {
      let coin = ''; let amount = 0; let price = 0;

      if (hash.startsWith('0x')) {
        price = await getLivePrice('ETH')
        const res = await fetch('https://eth-mainnet.g.alchemy.com/v2/RYP7UNwfgvPgVasAzO8NC', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionByHash", params: [hash], id: 1 })
        })
        const data = await res.json()
        if (data?.result?.value) {
          amount = parseInt(data.result.value, 16) / 1e18
          setReceiptData({
            hash, coin: 'Ethereum', symbol: 'ETH', amount: amount.toFixed(4),
            usdValue: (amount * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            date: new Date().toLocaleString(), from: data.result.from
          })
        }
      } else {
        price = await getLivePrice('BTC')
        const res = await fetch(`https://api.blockcypher.com/v1/btc/main/txs/${hash}`)
        const data = await res.json()
        if (data.hash) {
          amount = data.total / 1e8
          setReceiptData({
            hash, coin: 'Bitcoin', symbol: 'BTC', amount: amount.toFixed(6),
            usdValue: (amount * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            date: new Date().toLocaleString(), from: data.addresses[0]
          })
        }
      }
    } catch (e) { console.warn("Scanner Busy") }
    
    setIsValidating(false)
    setTimeout(() => setIsCooldown(false), 2000) // End cooldown after 2s
  }

  // Handle Admin Force Generate
  const handleAdminGenerate = async () => {
    if (!adminAmt) return
    setIsValidating(true)
    const price = await getLivePrice(adminCoin)
    setReceiptData({
      hash: adminHash || "0x" + Math.random().toString(16).slice(2, 42),
      coin: adminCoin === 'ETH' ? 'Ethereum' : 'Bitcoin',
      symbol: adminCoin,
      amount: parseFloat(adminAmt).toFixed(adminCoin === 'ETH' ? 4 : 6),
      usdValue: (parseFloat(adminAmt) * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      date: new Date().toLocaleString(),
      from: 'Admin Manual Settlement'
    })
    setIsValidating(false)
  }

  const downloadReceipt = () => {
    const doc = new jsPDF()
    doc.setFillColor(0, 0, 0); doc.rect(0, 0, 210, 50, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(26); doc.text("CRYPVERIFY", 20, 32)
    doc.setFontSize(10); doc.text("OFFICIAL SETTLEMENT RECEIPT", 20, 42)
    doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text("TRANSACTION DETAILS", 20, 70)
    doc.line(20, 72, 190, 72); doc.setFontSize(11)
    doc.text(`Asset: ${receiptData.coin}`, 20, 85); doc.text(`Amount: ${receiptData.amount} ${receiptData.symbol}`, 20, 95)
    doc.setFont("helvetica", "bold"); doc.text(`Value: ${receiptData.usdValue}`, 20, 105)
    doc.setFont("helvetica", "normal"); doc.text(`Timestamp: ${receiptData.date}`, 20, 115)
    doc.setFontSize(8); doc.text(`Hash: ${receiptData.hash}`, 20, 130)
    doc.save(`Crypverify_Receipt.pdf`)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
      
      {/* ADMIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl relative border-b-4 border-b-blue-600">
            <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-black mb-6 italic flex items-center gap-2 underline underline-offset-8 decoration-blue-500 tracking-tighter uppercase">Admin Link</h2>
            <input 
              type="password" autoFocus value={passInput} onChange={(e) => setPassInput(e.target.value)}
              className="w-full bg-black border border-zinc-800 p-4 rounded-xl mb-6 outline-none focus:border-blue-500 text-center tracking-[0.5em]"
              onKeyDown={(e) => e.key === 'Enter' && (passInput === "password" ? (setIsAdmin(true), setShowLogin(false), setPassInput('')) : alert("INVALID KEY"))}
            />
          </div>
        </div>
      )}

      <div className="max-w-xl w-full">
        <h1 className="text-6xl font-black italic tracking-tighter mb-10 text-center sm:text-left drop-shadow-2xl">CRYPVERIFY</h1>
        
        {/* SCANNER CARD */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] italic">Settlement Scanner</p>
             {isCooldown && <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400 animate-pulse"><Clock size={10}/> SCANNER COOLING...</div>}
          </div>
          
          <input 
            type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)}
            placeholder="Paste ETH or BTC Hash" 
            className="w-full bg-black border border-zinc-800 p-5 rounded-xl mb-6 font-mono text-sm focus:border-zinc-500 outline-none"
          />
          <button 
            onClick={validateOnChain} disabled={isValidating || isCooldown}
            className={`w-full py-5 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl ${isCooldown ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black active:scale-95'}`}
          >
            {isValidating ? <Loader2 className="animate-spin" /> : (isCooldown ? "Wait..." : "VERIFY & CONVERT")}
          </button>

          {receiptData && (
            <div className="mt-8 border-t border-zinc-800 pt-8 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">On-Chain Asset</p>
                  <p className="text-4xl font-black tracking-tight">{receiptData.amount} {receiptData.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-500 text-[10px] font-bold uppercase tracking-widest mb-1 italic">Verified Cash Value</p>
                  <p className="text-3xl font-black text-green-400">{receiptData.usdValue}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={downloadReceipt} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Receipt size={18}/> Get Receipt
                </button>
                <a href="https://crypverify.netlify.app/submit" className="flex-1 bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-center">
                  Submit Form <ArrowRight size={18}/>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ADMIN OVERRIDE PANEL */}
        {isAdmin && (
          <div className="mt-6 bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2rem] animate-in zoom-in duration-300 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black italic text-blue-400 tracking-tighter uppercase">Admin Override</h3>
              <button onClick={() => setIsAdmin(false)} className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-full text-zinc-400">LOGOUT</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {['ETH', 'BTC'].map((c) => (
                  <button key={c} onClick={() => setAdminCoin(c)} className={`flex-1 py-3 rounded-xl font-bold transition-all border ${adminCoin === c ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-black border-zinc-800 text-zinc-500'}`}>{c}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input placeholder={`Amount of ${adminCoin}`} value={adminAmt} onChange={(e) => setAdminAmt(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500" />
                <input placeholder="Manual Hash (Optional)" value={adminHash} onChange={(e) => setAdminHash(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-mono" />
              </div>
              <button onClick={handleAdminGenerate} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-blue-500 shadow-lg transition-all"><Coins size={16}/> Force Generate & Convert</button>
            </div>
          </div>
        )}
        
        <div className="mt-20 flex justify-between items-center px-4 opacity-10 hover:opacity-100 transition-opacity">
           <p className="text-[10px] font-bold tracking-[0.5em] text-zinc-500">CRYPVERIFY SECURE NODE</p>
           {!isAdmin && <button onClick={() => setShowLogin(true)}><Lock size={14}/></button>}
        </div>
      </div>
    </div>
  )
}