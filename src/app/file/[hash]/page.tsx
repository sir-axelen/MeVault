"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { motion } from "framer-motion";
import { useAptBalance, useSignAndSubmitTransaction, useViewModule } from "@aptos-labs/react";

export default function FileDownloadPage({ params }: { params: { hash: string } }) {
  const { connected, account, connect, disconnect, isLoading: walletLoading } = useWallet();
  const { signAndSubmitTransaction, isLoading: transactionLoading } = useSignAndSubmitTransaction();
  const isLoading = walletLoading || transactionLoading;

  const addressString = account?.address?.toString() || "";
  const address = addressString ? `${addressString.slice(0, 6)}...${addressString.slice(-4)}` : "";

  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Mock file data (In a real app, this is fetched from a backend or smart contract using the hash)
  const fileData = {
    name: "confidential_report_2026.pdf",
    size: "4.2 MB",
    locked: true,
    price: "0.5", // APT
    owner: "0x1234...abcd"
  };

  const connectWallet = () => {
    if (!connected) connect("Petra");
    else disconnect();
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
      
      // In a real app, we would fetch the actual owner address from the contract or backend.
      // We will use the user's own address as a mock for UI demonstration so the transaction doesn't fail due to missing accounts.
      const mockOwner = account.address; 
      
      await signAndSubmitTransaction({
        data: {
          function: "0x9cf5cbfa7d68e8278bcca7e36dadcb51ae973821400a52d066cd9e8803147c62::file_share::unlock_file",
          typeArguments: [],
          functionArguments: [mockOwner, params.hash]
        }
      });
      
      setUnlocked(true);
      setStatusMsg("✓ Payment successful. File unlocked.");
    } catch (error: any) {
      console.error(error);
      setStatusMsg("✗ Transaction rejected or failed.");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <>
      <nav className="glass sticky top-0 z-50 border-t-0 border-l-0 border-r-0">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "linear-gradient(135deg,#00e5ff,#7c3aed)",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L12 4.5V9.5L7 13L2 9.5V4.5L7 1Z" fill="rgba(0,0,0,0.8)" />
                <path d="M7 4L10 5.8V9.5L7 11.3L4 9.5V5.8L7 4Z" fill="white" opacity=".4" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm tracking-tight" style={{ fontFamily: 'var(--font-space-mono)' }}>
              Shelby<span style={{ color: "var(--shelby-accent)" }}>Share</span>
            </span>
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
            {fileData.size} • Stored on Aptos Decentralized Storage
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
              className="w-full py-3 rounded-xl text-sm mb-3 font-semibold"
              onClick={() => {
                const gateway = "https://gateway.irys.xyz";
                window.open(`${gateway}/${params.hash}`, "_blank");
              }}
              style={{
                background: "rgba(0,255,148,0.1)",
                color: "var(--shelby-green)",
                border: "1px solid rgba(0,255,148,0.3)",
                transition: "all 0.2s",
                cursor: "pointer"
              }}
            >
              Download File
            </button>
          )}

          {statusMsg && (
             <p className="text-xs fade-in mt-3" style={{ color: statusMsg.startsWith("✓") ? "var(--shelby-green)" : (statusMsg.startsWith("✗") ? "#ef4444" : "var(--shelby-muted)") }}>
                {statusMsg}
             </p>
          )}
        </div>
        
        <p className="text-center text-xs" style={{ color: "var(--shelby-muted)" }}>
           Powered by Shelby Protocol on Aptos
        </p>
      </motion.main>
    </>
  );
}
