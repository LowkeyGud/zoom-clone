import StreamVideoProvider from "@/providers/StreamClientProvider";
import React, { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZoOoM",
  description: "A zoom clone wannabe",
  icons: {
    icon: "/icons/logo.svg"
  }
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main>
      <StreamVideoProvider>{children}</StreamVideoProvider>
    </main>
  );
};

export default RootLayout;
