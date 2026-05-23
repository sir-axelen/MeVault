"use client";

import { useState, useEffect } from "react";

export function DebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      setLogs((prev) => [...prev, `LOG: ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`].slice(-20));
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      const stringifiedArgs = args.map(a => {
        if (a instanceof Error) return `${a.name}: ${a.message}`;
        if (typeof a === 'object') {
          try {
            // Include non-enumerable properties like 'message' in Errors
            return JSON.stringify(a, Object.getOwnPropertyNames(a), 2);
          } catch (e) {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');
      
      setLogs((prev) => [...prev, `ERROR: ${stringifiedArgs}`].slice(-20));
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999]"
      style={{ 
        maxWidth: "90vw",
        width: isOpen ? "400px" : "auto"
      }}
    >
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-black/80 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-mono backdrop-blur-md shadow-xl"
        >
          Open Debug Console
        </button>
      ) : (
        <div className="bg-black/90 border border-white/20 rounded-xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
            <span className="text-[10px] font-bold text-white/50 font-mono uppercase tracking-widest">Debug Console</span>
            <div className="flex gap-2">
              <button onClick={() => setLogs([])} className="text-[10px] text-white/50 hover:text-white font-mono">Clear</button>
              <button onClick={() => setIsOpen(false)} className="text-[10px] text-white/50 hover:text-white font-mono">Close</button>
            </div>
          </div>
          <div className="h-64 overflow-y-auto p-3 font-mono text-[10px] space-y-1 bg-black/40">
            {logs.length === 0 && <div className="text-white/20 italic">No logs yet...</div>}
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`${log.startsWith('ERROR') ? 'text-red-400' : 'text-green-400'} break-all border-b border-white/5 pb-1 last:border-0`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
