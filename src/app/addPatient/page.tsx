"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import supabase from "@/lib/supabaseClient";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { savePatientToDB, cnicExistsForUser } from "@/lib/patient-db";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStatusToast } from "@/lib/useStatusToast";

export default function SavePatientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cnic, setCnic] = useState(""); // raw digits
  const [displayCnic, setDisplayCnic] = useState(""); // formatted
  const [dob, setDOB] =  useState<Date | undefined>(undefined);
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    cnic?: string;
    dob?: string;
    gender?: string;
  }>({});
  const [statusData, setStatusData] = useState({status: "", message: ""});
  useStatusToast(statusData);


  /* ---------------- VALIDATION ---------------- */

  const validateName = (value: string) => {
    if (!value.trim()) return "Name is required";
    if (value.trim().length < 3)
      return "Name must be at least 3 characters";
    if (!/^[a-zA-Z\s]+$/.test(value))
      return "Only letters and spaces allowed";
    return "";
  };

  const validateCNIC = (value: string) => {
    if (!value) return "CNIC is required";
    if (!/^\d{13}$/.test(value))
      return "CNIC must be exactly 13 digits";
    return "";
  };

  const validateDOB = (date?: Date) => {
    if (!date) return "Date of birth is required";
    if (date > new Date())
      return "DOB cannot be in the future";
    return "";
  };

  const validateGender = (value: string) => {
    if (!value) return "Gender is required";
    return "";
  };

  /* ---------------- CNIC FORMATTER ---------------- */

  const formatCNIC = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);

    let formatted = digits;
    if (digits.length > 5)
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    if (digits.length > 12)
      formatted = `${digits.slice(0, 5)}-${digits.slice(
        5,
        12
      )}-${digits.slice(12)}`;

    return { digits, formatted };
  };


  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateName(name);
    const cnicError = validateCNIC(cnic);
    const dobError = validateDOB(dob);
    const genderError = validateGender(gender);

    if (nameError || cnicError || dobError || genderError) {
      setErrors({
        name: nameError,
        cnic: cnicError,
        dob: dobError,
        gender: genderError,
      });
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      toast.error("User not authenticated");
      setSaving(false);
      return;
    }

    try {
      const exists = await cnicExistsForUser(user.id, cnic); //check if the parctioner already has a patient with this cnic

      if (exists) {
        setErrors({ cnic: "This CNIC already exists among your patients." });
        setSaving(false);
        return;
      }

      const res= await savePatientToDB(
        name.trim(),
        cnic,
        dob!,  //it is 100% date
        gender,
        user.id,
      );
      setStatusData({ status: res.status, message: res.message });
      router.push("/patientDashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save patient");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#008080] to-[#00f5f5]">
      <Card className="w-full max-w-2xl mx-auto my-20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-5xl text-center font-dancing font-bold">
            Add a New Patient
          </CardTitle>
          <CardDescription>
            Fields marked with <span className="text-red-500">*</span> are required
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="grid gap-3">
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Doe Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* CNIC */}
            <div className="grid gap-3">
              <Label>
                CNIC <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="12345-1234567-1"
                value={displayCnic}
                onChange={(e) => {
                  const { digits, formatted } = formatCNIC(e.target.value);
                  setCnic(digits);
                  setDisplayCnic(formatted);
                }}
                inputMode="numeric"
              />
              {errors.cnic && (
                <p className="text-xs text-red-500 mt-1">{errors.cnic}</p>
              )}
              <span className="text-xs text-muted-foreground">
                CNIC cannot be changed afterwards.
              </span>
              <span className="text-xs text-muted-foreground">
                Dashes will be added automatically.
              </span>
            </div>

            {/* Gender */}
            <div className="grid gap-3">
              <Label>
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">male</SelectItem>
                  <SelectItem value="female">female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
              )}
            </div>

            {/* DOB */}
            <div className="grid gap-3">
              <Label>
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dob ? format(dob, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={(date) => setDOB(date)}
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dob && (
                <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="mt-8">
            <Button type="submit" className="w-full bg-teal-800 transition-all duration-300 ease-in-out font-semibold text-base tracking-wide hover:shadow-lg" disabled={saving}>
              {saving ? "Saving..." : "Save Patient"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
