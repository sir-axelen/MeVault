"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosCoreProvider } from "./AptosCoreProvider";

const queryClient = new QueryClient();
const wallets = [new PetraWallet()];

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
        <AptosCoreProvider>
          {children}
        </AptosCoreProvider>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
