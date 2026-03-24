"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [auth, setAuth]=useState(false);

  useEffect(() => {
    // Check if a session exists (i.e., user signed in via magic link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuth(true)
      }
    });
  }, [router]);

  useEffect(() => {
    const hash = window.location.hash;
    //if unautherized, ask to login again
    if (hash.includes("error=access_denied") && hash.includes("otp_expired")) {
      router.replace("/sign-in?error=access_denied");
    }
  }, [router]);

  return (
  <>
    <div className="min-h-[66vh] flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-[#008080] to-[#00f5f5] text-white text-center px-4">
      <h1 className="font-dancing text-6xl font-semibold">
        Welcome to <span className="text-black">PrivaFed</span>
      </h1>
      <p className="font-dancing text-3xl max-w-2xl">
        A Privacy-Preserving Federated Learning Framework.
      </p>

      <Link href={auth?"/addPatient":"/sign-in"} passHref>
        <Button
          className="font-dancing bg-black text-white font-black text-2xl px-5 py-5 rounded-2xl hover:bg-black cursor-pointer active:bg-transparent active:text-black"
        >
          Add Patient
        </Button>
      </Link>
    </div>

    <section className="py-16 bg-white text-gray-800">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4 font-dancing text-[#008080]">Features</h2>
        <p className="text-lg text-gray-600 mb-12">Empowering Healthcare Professionals Through Federated Intelligence.</p>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="bg-gradient-to-b from-teal-300 to-teal-100 p-6 rounded-2xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-2">AI-driven Stroke Segmentation</h3>
            <p className="text-gray-600">Utilize deep learning model to segment stroke-affected regions, aiding early and precise diagnosis.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-teal-300 to-teal-100 p-6 rounded-2xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Federated Learning</h3>
            <p className="text-gray-600">Train models collaboratively across hospitals and institutions while preserving patient privacy.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-bl from-teal-300 to-teal-100 p-6 rounded-2xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="text-xl font-semibold mb-2">Interactive Web Visualization</h3>
            <p className="text-gray-600">Manage patients and generate segmentation results through a secure, user-friendly web dashboard for medical practitioners and researchers.</p>
          </div>
        </div>
      </div>
    </section>
  </>
  );
}
