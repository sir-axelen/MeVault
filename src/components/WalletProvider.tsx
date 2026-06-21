"use client";

if (typeof window !== "undefined") {
  // Suppress unhandled rejections caused by AptosConnect wallet plugin
  // and Chrome extensions trying to fetch from networks that don't support them (SHELBYNET).
  // This prevents Next.js dev mode from crashing with "Unhandled Runtime Error".
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason instanceof TypeError && reason.message === "Failed to fetch") {
      event.preventDefault();
      return;
    }
    // Also catch errors from AptosConnect / wallet adapter initialization
    if (reason && typeof reason === "object") {
      const msg = reason.message || String(reason);
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("AptosConnect") ||
        msg.includes("getChainId") ||
        msg.includes("getLedgerInfo")
      ) {
        event.preventDefault();
        console.warn("[WalletProvider] Suppressed wallet init error:", msg);
        return;
      }
    }
  });
}

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AptosCoreProvider } from "./AptosCoreProvider";

import { ShelbyClientProvider } from "@shelby-protocol/react";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

const queryClient = new QueryClient();

const shelbyClient = new ShelbyClient({ 
  network: Network.SHELBYNET,
  apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
  indexer: {
    baseUrl: typeof window !== "undefined" ? `${window.location.origin}/api/shelby-indexer` : "http://localhost:3000/api/shelby-indexer",
  }
});

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ShelbyClientProvider client={shelbyClient}>
        <AptosWalletAdapterProvider
          optInWallets={["Petra"]}
          autoConnect={false}
          dappConfig={{
            network: Network.SHELBYNET,
            aptosConnect: { dappId: undefined as any },
          }}
        >
          <AptosCoreProvider>
            {children}
          </AptosCoreProvider>
        </AptosWalletAdapterProvider>
      </ShelbyClientProvider>
    </QueryClientProvider>
  );
}

