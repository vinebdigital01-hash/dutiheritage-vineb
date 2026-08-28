import React from "react";
import { AccountSidebarWrapper } from "./AccountSidebarWrapper";

export const metadata = {
  title: "My Account | Duti Heritage",
  description: "Manage your account, orders, addresses, and more.",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountSidebarWrapper>
      {children}
    </AccountSidebarWrapper>
  );
}
