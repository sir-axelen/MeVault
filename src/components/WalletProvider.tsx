"use client";

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason && event.reason.name === "TypeError" && event.reason.message === "Failed to fetch") {
      // Suppress the unhandled rejection from crashing Next.js (caused by extensions blocking AptosConnectWallet background fetch)
      event.preventDefault();
      console.warn("Suppressed background fetch error:", event.reason);
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
});

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ShelbyClientProvider client={shelbyClient}>
        <AptosWalletAdapterProvider optInWallets={["Petra"]} autoConnect={false}>
          <AptosCoreProvider>
            {children}
          </AptosCoreProvider>
        </AptosWalletAdapterProvider>
      </ShelbyClientProvider>
    </QueryClientProvider>
  );
}
