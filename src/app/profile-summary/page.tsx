"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfileSummaryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    };

    fetchProfile();
  }, [router]);

  if (!profile) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#008080] to-[#00f5f5] p-6">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold text-center">Profile Summary</h1>

        <div><strong>Name:</strong> {profile.full_name}</div>
        <div><strong>Email:</strong> {profile.email}</div>
        <div><strong>Phone:</strong> {profile.phone}</div>
        <div><strong>Gender:</strong> {profile.gender}</div>
        <div><strong>CNIC:</strong> {profile.cnic}</div>
        <div><strong>DOB:</strong> {profile.dob}</div>

        <hr />

        <div><strong>Hospital:</strong> {profile.hospital_affiliation}</div>
        <div><strong>License No:</strong> {profile.license_number}</div>
        <div><strong>Authority:</strong> {profile.license_authority}</div>
        <div><strong>Expiry:</strong> {profile.license_expiry_date}</div>

        <div className="flex justify-between pt-6">
          <Button onClick={() => router.push("/edit-profile")}>
            Edit Again
          </Button>

          <Button onClick={() => router.push("/patientDashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}