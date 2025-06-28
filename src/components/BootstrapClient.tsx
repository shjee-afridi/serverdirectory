'use client';

import { useEffect } from 'react';

// This component handles client-side Bootstrap JS initialization
export default function BootstrapClient() {
  useEffect(() => {
    // Import Bootstrap JS dynamically on client side
    import('bootstrap');
  }, []);

  return null; // This component doesn't render anything
}
