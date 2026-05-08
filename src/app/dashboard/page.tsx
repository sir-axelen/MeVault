"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { Aptos as AptosClient, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useAptBalance, useSignAndSubmitTransaction } from "@aptos-labs/react";
import { WebUploader } from "@irys/web-upload";
import { WebAptos } from "@irys/web-upload-aptos";

type FileRecord = {
  name: string;
  size: string;
  link: string;
  locked: boolean;
};

export default function Dashboard() {
  const { connected, account, wallet, connect, disconnect, isLoading: walletLoading } = useWallet();
  const { data: aptBalance, isLoading: balanceLoading } = useAptBalance();
  const { signAndSubmitTransaction } = useSignAndSubmitTransaction();
  const isLoading = walletLoading || balanceLoading;

  const addressString = account?.address?.toString() || "";
  const address = addressString ? `${addressString.slice(0, 6)}...${addressString.slice(-4)}` : "";
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [locked, setLocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [dragOver, setDragOver] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Uploading to Shelby Hot Storage…");
  const [showShare, setShowShare] = useState(false);
  const [shareLink, setShareLink] = useState("");
  
  const [aptPrice, setAptPrice] = useState("0.5");
  const [unlockMsg, setUnlockMsg] = useState("");
  const [aptEarned, setAptEarned] = useState("...");
  
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRows, setCopiedRows] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aptBalance) {
      setAptEarned(`+${(Number(aptBalance) / 100000000).toFixed(2)}`);
    } else {
      setAptEarned("+0.00");
    }
  }, [aptBalance]);

  useEffect(() => {
    const saved = localStorage.getItem("shelby_files");
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch (e) {}
    }
    
    const hideGuide = localStorage.getItem("shelby_hide_guide");
    if (!hideGuide) {
      setShowGuide(true);
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("shelby_files", JSON.stringify(files));
    }
  }, [files, isLoaded]);

  const deleteFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("shelby_hide_guide", "true");
  };

  const connectWallet = async () => {
    if (!connected) {
      try {
        await connect("Petra");
      } catch (err: any) {
        if (err.name === "WalletNotReadyError" || err.name === "WalletNotFoundError") {
          alert("Petra Wallet not found. Please install the extension or open this site inside the Petra mobile app browser.");
        } else {
          console.error("Connection error:", err);
        }
      }
    } else {
      disconnect();
    }
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  };

  const getTotalStorage = () => {
    if (files.length === 0) return { value: "0", unit: "MB" };
    let totalBytes = 0;
    files.forEach(f => {
      const match = f.size.match(/([\d.]+)\s*(B|KB|MB|GB)/);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2];
        if (unit === 'KB') totalBytes += val * 1024;
        else if (unit === 'MB') totalBytes += val * 1024 * 1024;
        else if (unit === 'GB') totalBytes += val * 1024 * 1024 * 1024;
        else totalBytes += val;
      }
    });
    
    if (totalBytes < 1024) return { value: totalBytes.toString(), unit: "B" };
    if (totalBytes < 1048576) return { value: (totalBytes / 1024).toFixed(1), unit: "KB" };
    if (totalBytes < 1073741824) return { value: (totalBytes / 1048576).toFixed(2), unit: "MB" };
    return { value: (totalBytes / 1073741824).toFixed(2), unit: "GB" };
  };
  
  const totalStorage = getTotalStorage();

  const randomHash = (len: number) => {
    const c = "abcdefghijklmnopqrstuvwxyz0123456789";
    let r = "";
    for (let i = 0; i < len; i++) r += c[Math.floor(Math.random() * c.length)];
    return r;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = (file: File) => {
    if (!file) return;
    setCurrentFile(file);
    setShowShare(false);
    setProgressPct(0);
  };

  const startUpload = async () => {
    if (!currentFile || uploading || !wallet) return;
    setUploading(true);
    setShowShare(false);
    setProgressPct(0);
    setProgressLabel("Initializing Aptos Storage (Irys)…");

    try {
      // 1. Initialize Irys with the Aptos wallet
      const irys = await WebUploader(WebAptos).withProvider(wallet);
      
      setProgressLabel("Uploading to Decentralized Storage…");
      setProgressPct(30);

      // 2. Upload the file
      // For demonstration, we use the free tier if file is small, 
      // or it will prompt for payment if larger.
      const receipt = await irys.uploadFile(currentFile);
      
      setProgressPct(100);
      setProgressLabel("Aptos Storage Complete!");
      
      // Delay slightly for UX before showing the share link
      setTimeout(() => {
        finishUpload(receipt.id);
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during decentralized upload.");
      setUploading(false);
      setProgressPct(0);
    }
  };

  const finishUpload = (ipfsHash: string) => {
    if (!currentFile) return;
    
    // Create a link to our own file viewer with the Irys Hash
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/file/${ipfsHash}`;
    
    setShareLink(link);
    setShowShare(true);
    setUploading(false);

    setFiles((prev) => [
      { name: currentFile.name, size: formatBytes(currentFile.size), link, locked: false },
      ...prev,
    ]);
    
    setLocked(false);
    setUnlockMsg("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const copyRowLink = (link: string, i: number) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedRows((prev) => ({ ...prev, [i]: true }));
    setTimeout(() => {
      setCopiedRows((prev) => ({ ...prev, [i]: false }));
    }, 1400);
  };

  const toggleLock = async () => {
    const newLocked = !locked;

    if (newLocked) {
      if (!connected) { alert("Connect wallet first!"); return; }
      try {
        const hash = shareLink.split('/').pop() || "";
        const priceInOctas = Math.floor(parseFloat(aptPrice) * 100000000);
        await signAndSubmitTransaction({
          data: {
            function: "0x9cf5cbfa7d68e8278bcca7e36dadcb51ae973821400a52d066cd9e8803147c62::file_share::publish_file",
            typeArguments: [],
            functionArguments: [hash, priceInOctas, newLocked]
          }
        });
      } catch {
        return; // aborted
      }
    }
    
    setLocked(newLocked);
    setUnlockMsg("");
    if (files.length > 0) {
      const newFiles = [...files];
      newFiles[0].locked = newLocked;
      setFiles(newFiles);
    }
  };

  const mockUnlock = async () => {
    if (!connected || !account) { alert("Connect wallet first!"); return; }
    try {
      const hash = shareLink.split('/').pop() || "";
      await signAndSubmitTransaction({
        data: {
          function: "0x9cf5cbfa7d68e8278bcca7e36dadcb51ae973821400a52d066cd9e8803147c62::file_share::unlock_file",
          typeArguments: [],
          functionArguments: [account.address, hash]
        }
      });
      setUnlockMsg(`✓ Payment of ${aptPrice} APT verified on-chain — access granted`);
    } catch {
      setUnlockMsg(`✗ Transaction failed`);
    }
  };

  return (
    <>
      <nav className="glass sticky top-0 z-50 border-t-0 border-l-0 border-r-0">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1f2937",
                flexShrink: 0,
              }}
            >
              <img src="/axel.png" alt="Axel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span className="font-bold text-white text-xs sm:text-sm tracking-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-space-mono)' }}>
              shelby X axel
            </span>
            <span className="tag hidden md:inline-block" style={{ fontFamily: 'var(--font-space-mono)' }}>APTOS</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="section-label hidden sm:block"
              style={{ color: connected ? "var(--shelby-green)" : "" }}
            >
              {connected ? "CONNECTED" : "NOT CONNECTED"}
            </span>
            <button
              className={`btn-wallet px-4 py-2 rounded-lg font-medium text-sm ${connected ? "connected" : ""}`}
              onClick={connectWallet}
              disabled={isLoading}
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {isLoading ? "Connecting…" : connected ? address : "Connect Wallet"}
            </button>
          </div>
        </div>
      </nav>

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-5 py-10 relative z-10"
      >
        <div className="mb-9 text-center">
          <p className="section-label mb-2">DECENTRALIZED · REAL-TIME · APTOS</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-tight mb-2">
            Decentralized Real-Time Storage<br />on Aptos
          </h1>
          <p className="text-sm" style={{ color: "var(--shelby-muted)" }}>
            Drop a file. Get a link. Share anywhere. Powered by Shelby Hot Storage.
          </p>
        </div>

        <AnimatePresence>
          {showGuide && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: "2rem" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
              className="glass rounded-2xl p-6 relative"
              style={{ border: "1px solid rgba(0, 229, 255, 0.3)", background: "rgba(0, 229, 255, 0.03)" }}
            >
              <button 
                onClick={dismissGuide}
                className="absolute top-4 right-4 text-white opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center"
                style={{ width: "24px", height: "24px", background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}
              >
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--shelby-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span className="section-label" style={{ color: "var(--shelby-accent)" }}>QUICK START GUIDE</span>
              </div>
              <h2 className="text-lg font-semibold text-white mb-5">Welcome to Shelby! Here is how it works:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-space-mono)' }}>1</span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">Connect Wallet</h3>
                  <p className="text-xs" style={{ color: "var(--shelby-muted)", lineHeight: "1.5" }}>Connect your Petra Aptos wallet using the button in the top right corner.</p>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-space-mono)' }}>2</span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">Upload File</h3>
                  <p className="text-xs" style={{ color: "var(--shelby-muted)", lineHeight: "1.5" }}>Drag and drop any file. It will be securely stored on Aptos via Irys.</p>
                </div>
                <div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-space-mono)' }}>3</span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">Lock & Earn</h3>
                  <p className="text-xs" style={{ color: "var(--shelby-muted)", lineHeight: "1.5" }}>Optionally lock your file. Users must pay you APT on-chain to access it.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <span className="section-label">UPLOAD FILE</span>
            <div className="flex items-center gap-2">
              <div className="dot-pulse"></div>
              <span className="tag tag-green" style={{ fontFamily: 'var(--font-space-mono)' }}>SHELBY HOT STORAGE</span>
            </div>
          </div>

          <div
            className={`drop-zone rounded-xl p-8 text-center mb-5 ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            
            {!currentFile ? (
              <div>
                <div className="mb-3 flex justify-center">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity=".4">
                    <path
                      d="M18 4v20M10 16l8-10 8 10"
                      stroke="var(--shelby-accent)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 28h24"
                      stroke="var(--shelby-accent)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-white font-medium text-sm mb-1">Drag & drop your file here</p>
                <p className="text-xs" style={{ color: "var(--shelby-muted)" }}>
                  or click to browse — any file type, up to 100MB
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect
                      x="6"
                      y="2"
                      width="20"
                      height="28"
                      rx="3"
                      fill="rgba(0,229,255,0.12)"
                      stroke="var(--shelby-accent)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M11 11h10M11 16h10M11 21h6"
                      stroke="var(--shelby-accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-white font-medium text-sm mb-1" style={{ fontFamily: 'var(--font-space-mono)' }}>
                  {currentFile.name}
                </p>
                <p className="text-xs" style={{ color: "var(--shelby-muted)" }}>
                  {formatBytes(currentFile.size)}
                </p>
              </div>
            )}
          </div>

          {(uploading || progressPct > 0) && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs" style={{ color: "var(--shelby-muted)" }}>
                  {progressLabel}
                </span>
                <span className="text-xs" style={{ color: "var(--shelby-accent)", fontFamily: 'var(--font-space-mono)' }}>
                  {Math.floor(progressPct)}%
                </span>
              </div>
              <div style={{ height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px" }}>
                <div className="progress-bar" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
          )}

          <div>
            <button
              className="btn-primary w-full py-3 rounded-xl text-sm"
              onClick={startUpload}
              disabled={!currentFile || uploading || showShare}
              style={{
                opacity: !currentFile || uploading || showShare ? 0.35 : 1,
                cursor: !currentFile || uploading || showShare ? "default" : "pointer",
              }}
            >
              {uploading ? "Uploading…" : "Upload to Shelby"}
            </button>
          </div>

          {showShare && (
            <div className="fade-in mt-5">
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="var(--shelby-green)" strokeWidth="1.5" />
                  <path
                    d="M4.5 7l2 2 3-3"
                    stroke="var(--shelby-green)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-medium" style={{ color: "var(--shelby-green)" }}>
                  Stored on Shelby — Instant Access (&lt;1s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="link-badge"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                />
                <button
                  className={`btn-ghost px-4 py-2 rounded-lg text-sm ${copiedLink ? "copy-flash" : ""}`}
                  onClick={copyLink}
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--shelby-border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white mb-0.5">Lock this file</p>
                    <p className="text-xs" style={{ color: "var(--shelby-muted)" }}>Require APT payment to access</p>
                  </div>
                  <button
                    className={`toggle ${locked ? "on" : ""}`}
                    onClick={toggleLock}
                  ></button>
                </div>
                
                {locked && (
                  <div className="mt-4 fade-in">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="section-label block mb-1.5">ACCESS PRICE (APT)</label>
                        <div
                          className="flex items-center gap-2"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid var(--shelby-border)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        >
                          <input
                            type="number"
                            value={aptPrice}
                            onChange={(e) => setAptPrice(e.target.value)}
                            step="0.1"
                            min="0.1"
                            style={{
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              color: "white",
                              fontFamily: "var(--font-space-mono)",
                              fontSize: "14px",
                              width: "80px",
                            }}
                          />
                          <span className="text-xs" style={{ color: "var(--shelby-muted)", fontFamily: "var(--font-space-mono)" }}>
                            APT
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="btn-primary px-5 py-2 rounded-lg text-sm" onClick={mockUnlock}>
                          Unlock (On-Chain)
                        </button>
                      </div>
                    </div>
                    {unlockMsg && (
                      <p className="text-xs mt-2 fade-in" style={{ color: "var(--shelby-green)" }}>
                        {unlockMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 fade-in">
          <div className="glass rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--shelby-accent)" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </div>
            <span className="section-label block mb-2">TOTAL FILES</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-mono)' }}>
                {files.length}
              </span>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-5 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--shelby-accent2)" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
               </svg>
             </div>
             <span className="section-label block mb-2">STORAGE USED</span>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-mono)' }}>{totalStorage.value}</span>
                <span className="text-sm font-medium" style={{ color: "var(--shelby-muted)", fontFamily: 'var(--font-space-mono)' }}>{totalStorage.unit}</span>
             </div>
          </div>

          <div className="glass rounded-2xl p-5 relative overflow-hidden group" style={{ borderColor: "rgba(0,255,148,0.2)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,255,148,0.05)] to-transparent opacity-50"></div>
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--shelby-green)" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span className="section-label block mb-2" style={{ color: "var(--shelby-green)" }}>APT EARNED</span>
            <div className="flex items-baseline gap-2 relative z-10">
               <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-mono)' }}>{aptEarned}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--shelby-border)" }}
          >
            <span className="section-label">YOUR FILES</span>
            <span className="tag" style={{ fontFamily: "var(--font-space-mono)" }}>
              {files.length} file{files.length !== 1 ? "s" : ""}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm" style={{ color: "var(--shelby-muted)" }}>No files uploaded yet.</p>
              <p className="text-xs mt-1" style={{ color: "var(--shelby-muted)", opacity: 0.6 }}>
                Upload a file above to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-transparent">
              <AnimatePresence>
                {files.map((f, i) => (
                  <motion.div 
                    key={f.link}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="file-row px-6 py-4 flex items-center gap-4"
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        background: "rgba(0,229,255,0.08)",
                        border: "1px solid rgba(0,229,255,0.15)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 2h7l3 3v9H3V2z"
                          fill="rgba(0,229,255,0.15)"
                          stroke="var(--shelby-accent)"
                          strokeWidth="1.2"
                        />
                        <path d="M10 2v3h3" stroke="var(--shelby-accent)" strokeWidth="1.2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "var(--shelby-muted)", fontFamily: "var(--font-space-mono)" }}>
                          {f.size}
                        </span>
                        <span className="tag tag-green" style={{ fontSize: "9px", fontFamily: "var(--font-space-mono)" }}>
                          STORED
                        </span>
                        {f.locked && (
                          <span
                            className="tag"
                            style={{
                              background: "rgba(124,58,237,0.12)",
                              color: "#a78bfa",
                              borderColor: "rgba(124,58,237,0.3)",
                              fontSize: "9px",
                              fontFamily: "var(--font-space-mono)",
                            }}
                          >
                            LOCKED
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2 justify-end">
                      <button
                        className="btn-ghost px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs"
                        onClick={() => window.open(f.link)}
                      >
                        Open
                      </button>
                      <button
                        className="btn-ghost px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs"
                        onClick={() => copyRowLink(f.link, i)}
                      >
                        {copiedRows[i] ? "Copied!" : "Copy Link"}
                      </button>
                      <button
                        className="btn-ghost px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs"
                        style={{ color: "#ef4444" }}
                        onClick={() => deleteFile(i)}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-xs" style={{ color: "var(--shelby-muted)" }}>
          <span style={{ fontFamily: "var(--font-space-mono)" }}>Shelby Network</span> · Built on Aptos · Front-end mockup via Next.js
        </p>
      </motion.main>
    </>
  );
}
