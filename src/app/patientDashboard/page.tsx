"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/protectedRoute";
import { getUserPatientsWithEmail } from "@/lib/patient-db";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react"
import { toast } from "sonner";
import { useStatusToast } from "@/lib/useStatusToast";

type Patient = {
  patient_id: string;
  cnic: string;
  name: string;
  dob: Date;
  gender: string;
  created_at: Date; 
};

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [count,setCount]=useState(0)
  const router = useRouter();
  const [loading,setLoading]=useState(false)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [statusData, setStatusData] = useState({status: "", message: ""});
  useStatusToast(statusData);

  useEffect(() => {
    getData();
  }, []);

    //fetching data from db
    const getData = async () => {
    try {
      setLoading(true)
      const data = await getUserPatientsWithEmail();
      setUserEmail(data?.email || "Guest");
      setPatients(data?.patients || []);
      setCount(data?.count || 0);
    } catch (error) {
      console.error("Failed to get Data");
      setStatusData({ status: "danger", message: "Failed to get Data" });
    }
    finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  function formatCNIC(cnic : string) {
    if (!cnic) return "";

    return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
  }

  function highlightText(text: string, search: string) {
    if (!search) return text;

    const regex = new RegExp(`(${search})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-black font-semibold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  //redirect to generate page
  const handleNewPatient = () => {
    router.push("/addPatient");
  };
  
  // Sort patients alphabetically
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const sortedPatients = [...filteredPatients].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  // Group by first letter
  const groupedPatients = sortedPatients.reduce<Record<string, Patient[]>>(
    (acc, patient) => {
      const letter = patient.name.charAt(0).toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(patient);
      return acc;
    },
    {}
  );

  // Get ordered alphabet keys
  const alphabetKeys = Object.keys(groupedPatients).sort();

  //loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-[#008080] to-[#00f5f5]">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mr-4"></div>
          <p className="text-white font-dancing text-6xl font-bold">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-2 text-black font-dancing">Dashboard</h1>
              <p className="text-gray-600">Welcome, <span className="font-medium text-[#008080]">{userEmail}</span></p>
              <p className="text-gray-600 font-mdeium">Your personal space to manage your patients ✨</p>
            </div>
            <button
              onClick={handleNewPatient}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#008080] text-white rounded-2xl shadow-md hover:bg-teal-800 transition-all duration-300 ease-in-out font-semibold text-base tracking-wide hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add New Patient
            </button>
          </div>

          <div className="flex justify-between items-center mt-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Total Patients</h2>
              <p className="text-2xl font-bold text-[#008080]">{count}</p>
            </div>

            <div className="relative w-4/12">
              {/* Search Icon */}
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  searchTerm ? "text-gray-400" :"text-[#008080]"
                }`}
              />

              {/* Input */}
              <input
                type="text"
                placeholder="Search Patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={patients.length === 0}
                className="w-full pl-10 pr-3 py-3 border rounded-xl border-[#008080] focus:outline-none focus:ring-2 focus:ring-[#008080] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Patients</h2>

            {patients.length === 0 ? (
              <p className="text-gray-500">
                You haven&apos;t added any patients yet. Click the 'Add New Patient' button to get started.
              </p>
            ) : debouncedSearch ? (
              <>
                <div className="mb-3 font-dancing">
                  {isSearching ? (
                    <p className="text-3xl text-gray-500 italic animate-pulse">
                      Searching...
                    </p>
                  ) : (
                    <p className="text-4xl font-semibold text-gray-800 mb-4">
                      Results for "<span>{debouncedSearch}</span>"
                    </p>
                  )}
                </div>

                {sortedPatients.length === 0 ? (
                  <p className="text-gray-500">
                    No patients found matching "{debouncedSearch}"
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sortedPatients.map((patient) => (
                      <div
                        key={patient.patient_id}
                        onClick={() => router.push(`/patient/${patient.patient_id}`)}
                        className="bg-[#008080] text-white p-4 rounded-md hover:drop-shadow-2xl transition hover:cursor-pointer"
                      >
                        <div className="grid grid-cols-[1fr_180px_180px] items-center">
                          <h3 className="font-medium truncate">
                            {highlightText(patient.name, debouncedSearch)}
                          </h3>

                          <p className="text-sm text-white italic truncate">
                            CNIC: {formatCNIC(patient.cnic)}
                          </p>

                          <p className="text-sm text-white italic truncate">
                            DOB: {new Date(patient.dob).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {alphabetKeys.map((letter) => (
                  <div key={letter} className="space-y-3">
                    <div className="sticky top-0 z-10 bg-white py-1">
                      <h3 className="text-xl font-bold text-[#008080] font-dancing">
                        {letter}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {groupedPatients[letter].map((patient) => (
                        <div
                          key={patient.patient_id}
                          onClick={() => router.push(`/patient/${patient.patient_id}`)}
                          className="bg-[#008080] text-white p-4 rounded-md hover:drop-shadow-2xl transition hover:cursor-pointer"
                        >
                          <div className="grid grid-cols-[1fr_180px_180px] items-center">
                            <h3 className="font-medium truncate">
                              {patient.name}
                            </h3>

                            <p className="text-sm text-white italic truncate">
                              CNIC: {formatCNIC(patient.cnic)}
                            </p>

                            <p className="text-sm text-white italic truncate">
                              DOB: {new Date(patient.dob).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
