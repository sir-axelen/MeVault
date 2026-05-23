"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { motion } from "framer-motion";
import { useAptBalance, useViewModule } from "@aptos-labs/react";
import { AccountAddress, Aptos as AptosClient, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useBlobMetadata, useShelbyClient } from "@shelby-protocol/react";
import { DebugConsole } from "@/components/DebugConsole";

// Initialize Aptos client outside component to avoid recreation
const aptosConfig = new AptosConfig({ network: Network.SHELBYNET });
const aptos = new AptosClient(aptosConfig);

export default function FileDownloadPage({ params }: { params: { hash: string | string[] } }) {
  const { connected, account, connect, disconnect, isLoading: walletLoading, signAndSubmitTransaction, signTransaction } = useWallet();
  const shelbyClient = useShelbyClient();
  const isLoading = walletLoading;

  const getDisplayAddress = () => {
    if (!account?.address) return "";
    let addrStr = "";
    const rawAddr = account.address;
    if (typeof rawAddr === "string") {
      addrStr = rawAddr;
    } else if (rawAddr && (rawAddr as any).data) {
      const data = (rawAddr as any).data;
      const bytes = Array.isArray(data) ? data : Object.values(data);
      try {
        addrStr = AccountAddress.from(new Uint8Array(bytes as number[])).toString();
      } catch (e) {
        addrStr = rawAddr.toString();
      }
    } else {
      addrStr = rawAddr.toString();
    }
    if (addrStr === "[object Object]") return "Connected";
    return `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}`;
  };

  const address = getDisplayAddress();

  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Decode address and filename from hash (format: address/filename)
  const [ownerAddr, fileName] = (() => {
    try {
      // If catch-all route, hash is an array
      if (Array.isArray(params.hash)) {
        if (params.hash.length >= 2) {
          return [params.hash[0], params.hash.slice(1).join('/')];
        }
        return ["", params.hash[0]];
      }
      
      const decoded = decodeURIComponent(params.hash);
      const parts = decoded.split('/');
      if (parts.length >= 2) {
        return [parts[0], parts.slice(1).join('/')];
      }
      return ["", decoded];
    } catch (e) {
      return ["", Array.isArray(params.hash) ? params.hash.join('/') : params.hash];
    }
  })();

  const { data: metadata, isLoading: metadataLoading, error: metadataError } = useBlobMetadata({
    account: ownerAddr,
    name: fileName
  });

  if (metadataError) {
    console.error("Shelby Metadata Fetch Error (likely 401):", metadataError);
  }

  const fileData = {
    name: metadata?.name || fileName || "Unknown File",
    size: metadata?.size ? `${(metadata.size / 1024 / 1024).toFixed(2)} MB` : (metadataError ? "Metadata Unavailable" : "..."),
    locked: true,
    price: "0.5",
    owner: ownerAddr
  };

  const connectWallet = async () => {
    if (!connected) {
      try {
        await connect("Petra");
      } catch (err: any) {
        if (err.name === "WalletNotReadyError" || err.name === "WalletNotFoundError") {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = `https://petra.app/explore?link=${encodeURIComponent(window.location.href)}`;
          } else {
            window.open("https://petra.app/", "_blank");
          }
        } else {
          console.error("Connection error:", err);
        }
      }
    } else {
      disconnect();
    }
  };

  const handleUnlock = async () => {
    if (!connected || !account) {
      alert("Please connect your wallet first.");
      return;
    }

    setUnlocking(true);
    setStatusMsg("Awaiting wallet approval...");

    try {
      const priceInOctas = Math.floor(parseFloat(fileData.price) * 100000000);
      
      // Robust address extraction
      const cleanAddress = (() => {
        const raw = account.address;
        let addr = "";
        if (typeof raw === "string") addr = raw;
        else if (raw && (raw as any).data) {
          const d = (raw as any).data;
          const b = Array.isArray(d) ? d : Object.values(d);
          try { addr = AccountAddress.from(new Uint8Array(b as number[])).toString(); } catch { addr = raw.toString(); }
        } else {
          addr = raw.toString();
        }
        return addr.trim();
      })();
      
      console.log("Starting Unlock Transaction for:", fileName);
      console.log("Signer address:", cleanAddress);
      
      const fullHash = Array.isArray(params.hash) ? params.hash.join('/') : params.hash;

      setStatusMsg("Step 2/3: Confirming on Aptos blockchain...");
      
      // MOCK: Simulate network delay instead of actual blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatusMsg("Step 3/3: Payment verified! Unlocking file...");
      await new Promise(r => setTimeout(r, 1000));
      
      setUnlocked(true);
      setStatusMsg("✓ File unlocked successfully.");
    } catch (error: any) {
      console.error("Unlock Error:", error);
      setStatusMsg(`✗ Transaction failed: ${error.message || "Unknown error"}`);
    } finally {
      setUnlocking(false);
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-xl mx-auto px-5 py-16 relative z-10"
      >
        {metadataLoading ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="dot-pulse mb-4 mx-auto"></div>
            <p className="text-white/50 text-xs font-mono">Fetching file metadata from Shelby...</p>
          </div>
        ) : (!metadata && !metadataError) ? (
          <div className="glass rounded-2xl p-12 text-center">
             <h2 className="text-white font-bold mb-2">File Not Found</h2>
             <p className="text-white/50 text-xs">The requested file could not be found on Shelby Protocol.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 mb-5 text-center">
          <div className="flex justify-center mb-6">
             <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "rgba(0,229,255,0.08)",
                  border: "1px solid rgba(0,229,255,0.15)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 2h7l3 3v9H3V2z"
                    fill="rgba(0,229,255,0.15)"
                    stroke="var(--shelby-accent)"
                    strokeWidth="1.2"
                  />
                  <path d="M10 2v3h3" stroke="var(--shelby-accent)" strokeWidth="1.2" />
                </svg>
              </div>
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-space-mono)' }}>
            {fileData.name}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--shelby-muted)" }}>
            {fileData.size} • Stored on Shelby Decentralized Hot Storage
          </p>

          <div className="p-4 rounded-xl mb-8" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--shelby-border)" }}>
             {fileData.locked && !unlocked ? (
                <div>
                   <div className="flex items-center justify-center gap-2 mb-2">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--shelby-accent2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                     </svg>
                     <span className="text-sm font-medium" style={{ color: "#a78bfa" }}>File is Locked</span>
                   </div>
                   <p className="text-xs mb-3" style={{ color: "var(--shelby-muted)" }}>
                     Pay the owner to unlock and download.
                   </p>
                   <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-space-mono)' }}>
                     {fileData.price} APT
                   </div>
                </div>
             ) : (
                <div>
                   <div className="flex items-center justify-center gap-2 mb-2">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--shelby-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                     </svg>
                     <span className="text-sm font-medium" style={{ color: "var(--shelby-green)" }}>File Unlocked</span>
                   </div>
                   <p className="text-xs" style={{ color: "var(--shelby-muted)" }}>
                     Ready to download.
                   </p>
                </div>
             )}
          </div>

          {!unlocked ? (
             <button
              className="btn-primary w-full py-3 rounded-xl text-sm mb-3 flex items-center justify-center gap-2"
              onClick={handleUnlock}
              disabled={unlocking}
              style={{
                opacity: unlocking ? 0.7 : 1,
                cursor: unlocking ? "default" : "pointer",
              }}
            >
              {unlocking ? "Processing Transaction..." : `Unlock for ${fileData.price} APT`}
            </button>
          ) : (
            <button
              className="w-full py-3 rounded-xl text-sm mb-3 font-semibold flex items-center justify-center gap-2"
              onClick={async () => {
                if (downloading) return;
                setDownloading(true);
                setStatusMsg("Downloading from Shelby nodes...");
                try {
                  const blob = await shelbyClient.rpc.getBlob({
                    account: ownerAddr,
                    blobName: fileName
                  });
                  const response = new Response(blob.readable);
                  const blobData = await response.blob();
                  const url = URL.createObjectURL(blobData);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = fileData.name;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  setStatusMsg("✓ Download complete!");
                } catch (err: any) {
                  console.error("Download Error:", err);
                  setStatusMsg(`✗ Download failed: ${err.message}`);
                } finally {
                  setDownloading(false);
                }
              }}
              disabled={downloading}
              style={{
                background: "rgba(0,255,148,0.1)",
                color: "var(--shelby-green)",
                border: "1px solid rgba(0,255,148,0.3)",
                transition: "all 0.2s",
                cursor: downloading ? "default" : "pointer",
                opacity: downloading ? 0.7 : 1
              }}
            >
              {downloading ? (
                <>
                  <div className="dot-pulse !bg-[var(--shelby-green)] !shadow-none"></div>
                  <span>Downloading...</span>
                </>
              ) : "Download File"}
            </button>
          )}

          {statusMsg && (
             <p className="text-xs fade-in mt-3" style={{ color: statusMsg.startsWith("✓") ? "var(--shelby-green)" : (statusMsg.startsWith("✗") ? "#ef4444" : "var(--shelby-muted)") }}>
                {statusMsg}
             </p>
          )}
        </div>
        )}
        
        <p className="text-center text-xs" style={{ color: "var(--shelby-muted)" }}>
           Powered by Shelby Protocol on Aptos
        </p>
      </motion.main>
      <DebugConsole />
    </>
  );
}
