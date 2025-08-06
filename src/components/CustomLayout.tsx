"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import CustomNavbar from "./CustomNavbar";
import LoadingIndicator from "./LoadingIndicator";

interface CustomLayoutProps {
  children: React.ReactNode;
  pageMap?: any;
  docsRepositoryBase?: string;
  footer?: React.ReactNode;
}

const CustomLayout: React.FC<CustomLayoutProps> = ({
  children,
  pageMap,
  docsRepositoryBase,
  footer,
}) => {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle route changes
  useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleComplete = () => setIsPageLoading(false);

    // Listen for route changes
    window.addEventListener("beforeunload", handleStart);

    // Reset loading when pathname changes
    setIsPageLoading(false);

    return () => {
      window.removeEventListener("beforeunload", handleStart);
    };
  }, [pathname]);

  const navbarItems = [
    { label: "Home", href: "/" },
    { label: "Controller", href: "/controller" },
    { label: "Model", href: "/model" },
    { label: "Migration", href: "/migration" },
    { label: "View", href: "/view" },
    { label: "Routing", href: "/routing" },
    { label: "Validation", href: "/validation" },
    { label: "Error Handling", href: "/error" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial Loading Screen */}
      {isInitialLoad && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingIndicator
              size="lg"
              color="blue"
              text="Loading BMS Documentation..."
            />
            <p className="mt-4 text-gray-600">
              Preparing your documentation experience
            </p>
          </div>
        </div>
      )}

      {/* Custom Navbar */}
      <CustomNavbar items={navbarItems} pageMap={pageMap} />

      {/* Page Loading Indicator */}
      {isPageLoading && (
        <div className="fixed top-0 left-0 right-0 z-40">
          <div className="h-1 bg-blue-500 animate-pulse"></div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {footer}
          </div>
        </footer>
      )}

      {/* Global Loading Overlay */}
      {isPageLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
          <LoadingIndicator size="md" color="blue" text="Loading page..." />
        </div>
      )}
    </div>
  );
};

export default CustomLayout;
