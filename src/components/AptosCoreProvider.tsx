"use client";

import { PropsWithChildren } from "react";
import { AptosJSCoreProvider } from "@aptos-labs/react";
import { useWalletAdapterCore } from "@aptos-labs/react/connectors";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

import { Network } from "@aptos-labs/ts-sdk";

export function AptosCoreProvider({ children }: PropsWithChildren) {
  const wallet = useWallet();
  const core = useWalletAdapterCore({ 
    wallet,
    defaultNetwork: { network: Network.SHELBYNET }
  });
  return <AptosJSCoreProvider core={core}>{children}</AptosJSCoreProvider>;
}
