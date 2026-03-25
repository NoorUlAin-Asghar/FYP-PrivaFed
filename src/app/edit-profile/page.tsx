"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ---------------- Helper Functions ---------------- */

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const formatCNIC = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (digits.length <= 5) return digits;
  if (digits.length <= 12)
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("");

  // 🔹 NEW STATES
  const [hospital, setHospital] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseAuthority, setLicenseAuthority] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  const [hasProfile, setHasProfile] = useState(false);

  /* ---------------- Load user data ---------------- */
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user || error) {
        router.push("/sign-in");
        return;
      }

      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("*") // 🔹 fetch all including new fields
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setName(data.full_name || "");
        setPhone(formatPhone(data.phone || ""));
        setGender(data.gender || "");
        setCnic(formatCNIC(data.cnic || ""));
        setDob(data.dob || "");

        // 🔹 LOAD NEW FIELDS
        setHospital(data.hospital_affiliation || "");
        setLicenseNumber(data.license_number || "");
        setLicenseAuthority(data.license_authority || "");
        setLicenseExpiry(data.license_expiry_date || "");

        setHasProfile(true);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  /* ---------------- Save profile ---------------- */
  const handleSave = async () => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    const cnicDigits = cnic.replace(/\D/g, "");

    if (!name.trim()) {
      toast.error("Full name is required");
      setSaving(false);
      return;
    }

    if (phone && phoneDigits.length !== 11) {
      toast.error("Phone number must be exactly 11 digits");
      setSaving(false);
      return;
    }

    if (!hasProfile && !cnic.trim()) {
      toast.error("CNIC is required for initial profile creation");
      setSaving(false);
      return;
    }

    if (!hasProfile && cnicDigits.length !== 13) {
      toast.error("CNIC must be exactly 13 digits");
      setSaving(false);
      return;
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, cnic")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      toast.error(fetchError.message);
      setSaving(false);
      return;
    }

    if (existingProfile) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: phoneDigits || null,
          gender,
          dob: dob,

          // 🔹 NEW FIELDS
          hospital_affiliation: hospital || null,
          license_number: licenseNumber || null,
          license_authority: licenseAuthority || null,
          license_expiry_date: licenseExpiry || null,

          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: name,
          phone: phoneDigits || null,
          gender: gender || null,
          cnic: cnicDigits || null,
          dob: dob || null,

          // 🔹 NEW FIELDS
          hospital_affiliation: hospital || null,
          license_number: licenseNumber || null,
          license_authority: licenseAuthority || null,
          license_expiry_date: licenseExpiry || null,

          updated_at: new Date().toISOString(),
        });

      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }

    toast.success("Profile saved successfully");
    router.push("/profile-summary");
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#008080] to-[#00f5f5]">
      <Card className="w-full max-w-2xl shadow-xl my-20">
        <CardHeader>
          <CardTitle className="text-5xl text-center font-dancing font-bold">
            Edit Profile
          </CardTitle>
          <CardDescription className="text-center">
            Update your personal information
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <Label>Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="0300-1234567"
            />
          </div>

          <div>
            <Label>Gender</Label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label>CNIC {!hasProfile && "*"}</Label>
            <Input
              value={cnic}
              onChange={(e) => setCnic(formatCNIC(e.target.value))}
              disabled={hasProfile}
            />
          </div>

          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          {/* 🔹 NEW UI FIELDS */}

          <div>
            <Label>Hospital Affiliation</Label>
            <Input value={hospital} onChange={(e) => setHospital(e.target.value)} />
          </div>

          <div>
            <Label>License Number</Label>
            <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>

          <div>
            <Label>License Authority</Label>
            <Input value={licenseAuthority} onChange={(e) => setLicenseAuthority(e.target.value)} />
          </div>

          <div>
            <Label>License Expiry Date</Label>
            <Input
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}