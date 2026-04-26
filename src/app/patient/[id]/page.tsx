"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams  } from "next/navigation";
import ProtectedRoute from "@/components/protectedRoute";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getPatientById, updatePatientToDb, deletePatientFromDb } from "@/lib/patient-db";
import { getScansForPatient } from "@/lib/scan-db";
import { useStatusToast } from "@/lib/useStatusToast";

import {
  User,
  CalendarDays,
  IdCard,
  VenusAndMars,
  Pencil,
  Trash2,
  Plus,
  Clock,
  RefreshCcw,
  Cake,
  ScanLine,
  FileText,
  CheckCircle2,
  HourglassIcon,
} from "lucide-react";

type Patient = {
  patient_id: string;
  cnic: string;
  name: string;
  dob: Date;
  gender: string;
  created_at: Date;
  updated_at: Date | undefined;
};

type Scan = {
  scan_id: string;
  scan_type: string;
  notes: string;
  file_url: string;
  created_at: string;
  segmented_url: string | null;
  original_slice_url: string | null;
  segmented_at: string | null;
};


//calculating age from date of birth
const calculateAge = (dob: Date) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

//formnat cnic with dashes
function formatCNIC(cnic : string) {
    if (!cnic) return "";

    return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
  }

//displaying patient information 
function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#008080] mt-1">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient>();
  const router = useRouter();
  
  const [editedName, setEditedName] = useState("");
  const [editedDOB, setEditedDOB] = useState<Date>(new Date());
  const [editedGender, setEditedGender] = useState("");
  const [loading,setLoading]=useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [scans, setScans] = useState<Scan[]>([]);

  const [statusData, setStatusData] = useState({status: "", message: ""});
  useStatusToast(statusData);

  useEffect(() => {
    if (!id) return;
    fetchPatient();
    fetchScans();
  }, []);

  //fetching data from db
  const fetchPatient  = async () => {
    try {
      setLoading(true)
      const data = await getPatientById(id);
      console.log(data)

      const normalizedPatient: Patient = {
      patient_id: String(data.patient_id),
      name: data.name,
      gender: data.gender,
      cnic: String(data.cnic),
      dob: new Date(data.dob),
      created_at: new Date(data.created_at),
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
      };

      setPatient(normalizedPatient);
      
    } catch (error) {
        console.error("Failed to get Data");
    }
    finally{
        setLoading(false);
    }
  };

  const fetchScans = async () => {
    const { scans: data } = await getScansForPatient(id);
    setScans(data as Scan[]);
  };

  const handleNewScan = () => {
    if (!patient) return;
    router.push(`/scan-upload?patientId=${patient.patient_id}`);
  };
  
  //edit patient
  const editPatient = async (patient: Patient, id: string, newName: string, newDOB: Date, newGender: string) => {
    try{
      //if no changes are made, no need to edit
      if (newName===patient.name && newDOB===patient.dob && newGender===patient.gender)
        return;

      setLoading(true);
      console.log("Saving")
      // console.log("Saving", id, newTitle, newBody);
      const res=await updatePatientToDb(id,newName,newDOB, newGender)
      setStatusData({ status: res.status, message: res.message });
      await fetchPatient();
    }
    finally{
      setLoading(false)
    }
  };

  //delete patient
  const deletePatient = async (id: string) => {
    try{
      const confirmed = window.confirm(
        "Are you sure you want to delete this patient? This action cannot be undone."
      );
      if (!confirmed) return;

      setLoading(true)
      console.log("Deleting")
      // console.log("Deleting", id);
      const res=await deletePatientFromDb(id)
      setStatusData({ status: res.status, message: res.message });
      // await fetchPatient();
      if (res.status==='success'){

        //if successful delete redirect to dashboard
         router.push("/patientDashboard");
      }
    }
    finally{
      setLoading(false)
    }
  };


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

if (patient){
  return (
    <ProtectedRoute>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-2 text-black font-dancing">Patient Profile</h1>
              <p className="text-gray-600">CNIC: <span className="font-medium text-[#008080]">{formatCNIC(patient.cnic)}</span></p>
            </div>
            <button
              onClick={handleNewScan}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#008080] text-white rounded-2xl shadow-md hover:bg-teal-800 transition-all duration-300 ease-in-out font-semibold text-base tracking-wide hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add New Scan
            </button>
          </div>

          {/* Patient Details Card */}
          <div className="bg-[#008080] p-6 rounded-2xl shadow-lg">
            <div className="bg-white rounded-xl p-6">

              {/* Header row */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-dancing">
                  Personal Details
                </h2>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 cursor-pointer"
                    onClick={() => {
                      setEditedName(patient.name);
                      setEditedDOB(patient.dob);
                      setEditedGender(patient.gender);
                      setSheetOpen(true);
                    }}
                  >
                  <Pencil className="w-4 h-4" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    className="gap-2 cursor-pointer"
                    onClick={() => deletePatient(patient.patient_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Name */}
                <DetailItem icon={<User />} label="Name" value={patient.name} />

                {/* CNIC */}
                <DetailItem icon={<IdCard />} label="CNIC" value={formatCNIC(patient.cnic)} />

                {/* DOB */}
                <DetailItem
                  icon={<CalendarDays />}
                  label="Date of Birth"
                  value={patient.dob.toLocaleDateString()}
                />

                {/* Age - derived */}
                <DetailItem
                  icon={<Cake />}
                  label="Age"
                  value={`${calculateAge(patient.dob)} years`}
                />


                {/* Gender */}
                <DetailItem
                  icon={<VenusAndMars />}
                  label="Gender"
                  value={patient.gender}
                />
              </div>
              {/* Meta info */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-4 text-sm text-gray-500">

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#008080]" />
                  <span>
                    Created on{" "}
                    <span className="font-medium text-gray-700">
                      {patient.created_at.toLocaleString()}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-[#008080]" />
                  <span>
                    Last updated{" "}
                    <span className="font-medium text-gray-700">
                      {patient.updated_at?.toLocaleString() || "—"}
                    </span>
                  </span>
                </div>

              </div>

            </div>
          </div>

          {/*Edit Sheet of Patient Info*/}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit Patient</SheetTitle>
                <SheetDescription>
                  Update your patient information. Save to apply changes.
                </SheetDescription>
              </SheetHeader>

              <div className="grid flex-1 auto-rows-min gap-6 px-4 mt-4">

                <div className="grid gap-1">
                  <Label>CNIC</Label>
                  <Input value={formatCNIC(patient.cnic)} readOnly disabled />
                  <span className="text-xs text-muted-foreground">
                    CNIC cannot be changed
                  </span>
                </div>


                <div className="grid gap-1">
                  <Label>Name</Label>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-1">
                  <Label>Gender</Label>
                  <Select
                    value={editedGender}
                    onValueChange={setEditedGender}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Gender</SelectLabel>
                        <SelectItem value="female">female</SelectItem>
                        <SelectItem value="male">male</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label>Date of Birth</Label>

                  <Popover
                    open={calendarOpen}
                    onOpenChange={setCalendarOpen}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start font-normal"
                      >
                        {editedDOB.toLocaleDateString()}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      sideOffset={4}
                      className="z-50 pointer-events-auto w-auto p-0"
                    >
                      <Calendar
                        mode="single"
                        selected={editedDOB}
                        defaultMonth={editedDOB}
                        captionLayout="dropdown"
                        onMonthChange={(month) => {
                          const newDate = new Date(editedDOB);

                          newDate.setFullYear(month.getFullYear());
                          newDate.setMonth(month.getMonth());

                          setEditedDOB(newDate);
                        }}
                        onSelect={(date) => {
                          if (date) {
                            setEditedDOB(date);
                            setCalendarOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>


                <div className="grid gap-1">
                  <Label>Age</Label>
                  <Input value={`${calculateAge(editedDOB)}`} readOnly disabled/>
                  <span className="text-xs text-muted-foreground">
                    Age is calculated automatically from date of birth
                  </span>
                </div>

              </div>

              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    className="flex-1 bg-[#008080] cursor-pointer"
                    onClick={() =>
                      editPatient(
                        patient,
                        patient.patient_id,
                        editedName,
                        editedDOB,
                        editedGender
                      )
                    }
                  >
                    Save Changes
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>




          {/* <div className="flex justify-between items-center mt-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Total Scans</h2>
              <p className="text-2xl font-bold text-[#008080]">{count}</p>
            </div>
          </div> */}

          {/* Patient Scan History — UC 4.11 */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 font-dancing">
              Scan History
            </h2>

            {scans.length === 0 ? (
              <div className="text-center text-gray-500 py-10 border border-dashed rounded-xl">
                No historical data available for this patient.
              </div>
            ) : (
              <div className="space-y-4">
                {scans.map((scan) => (
                  <div
                    key={scan.scan_id}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Scan info */}
                      <div className="flex items-start gap-3">
                        <ScanLine className="w-6 h-6 text-[#008080] mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {scan.scan_type || "MRI Scan"}
                          </p>
                          {scan.notes && (
                            <p className="text-sm text-gray-500 mt-0.5">{scan.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Uploaded: {new Date(scan.created_at).toLocaleString()}
                          </p>
                          {scan.segmented_at && (
                            <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Analysed: {new Date(scan.segmented_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Segmented thumbnail + actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {scan.segmented_url ? (
                          <img
                            src={scan.segmented_url}
                            alt="Segmented"
                            className="w-16 h-16 rounded-lg object-cover border-2 border-teal-400"
                          />
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <HourglassIcon className="w-3 h-3" />
                            Not yet analysed
                          </div>
                        )}

                        <Button
                          size="sm"
                          className="bg-[#008080] hover:bg-teal-800 text-white"
                          onClick={() =>
                            router.push(`/result-page?scanId=${scan.scan_id}`)
                          }
                        >
                          {scan.segmented_url ? "View Result" : "Run Segmentation"}
                        </Button>

                        {scan.segmented_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() =>
                              router.push(`/report/${scan.scan_id}`)
                            }
                          >
                            <FileText className="w-3 h-3" />
                            Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
}
