"use client"

import { useEffect } from "react"
import { useRouter } from "next/router";
import Dashboard from './dashboard';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard when someone visits the root URL
    router.push('/dashboard');
  }, [router]);

  // Show a simple loading message while redirecting
  return (
    <div style={{

    }}>

    </div>
  );
}
