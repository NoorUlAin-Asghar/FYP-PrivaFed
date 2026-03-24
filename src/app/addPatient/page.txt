"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { savePatientToDB } from "@/lib/patient-db";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function GeneratePitchCard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [tone, setTone] = useState("");
  const [customType, setCustomType] = useState("");
  const [customTone, setCustomTone] = useState("");
  const [pitch, setPitch] = useState("");
  const [generate, setGenerate]=useState(false);
  const [temp, setTemp]=useState("")
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = type === "others" ? customType : type;
    setType(finalType)
    const finalTone = tone === "others" ? customTone : tone;
    setTone(finalTone)
    setGenerate(true);
    setTemp(
      `🎯 Title: ${title}\n📦 Description: ${description}\n📣 Type: ${finalType}\n🎙️ Tone: ${finalTone}\n`
    )

    try{
      //giving call to pitch-writer to generate pitch
      const res = await fetch("/api/pitch-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, type, tone
        }),
      });

        const data = await res.json();
        if (!res.ok) {
          toast.error("Couldn't generate pitch");
        }
        else {
          console.log("Pitch received: " ,data.pitch);
          setPitch(data.pitch)
        }

    }
    catch(err){
      // console.log(err)
      toast.error("Couldn't generate pitch")
    }
    finally{
      setGenerate(false);
    }
  };

  const savePitch=async()=>{
    setSaving(true);
    const titleMatch = pitch.match(/Title:\s*["“]?(.+?)["”]?\n/i);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled";
    const body = pitch.replace(titleMatch?.[0] || "", "").trim();

    //checking user authentication
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      console.error("User not authenticated");
      return;
    }

    try { //save pitch to db with correct user
      await savePitchToDB({ title, body, user_id: user.id });
      router.push("/dashboard");
    }
    catch(error){
      console.error("Failed to save to DB "/*,error*/)
    }
    finally{
      setSaving(false)
    }

  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-[#008080] to-[#00f5f5]">
    <Card className="w-full max-w-2xl mx-auto my-20 shadow-xl mb-5">
      <CardHeader>
        <CardTitle className="text-5xl text-center font-dancing font-bold mb-2">Write a New Pitch</CardTitle>
        <CardDescription>Fill in the details to get your pitch instantly.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div>
            <Label htmlFor="title">Pitch Title</Label>
            <Input
              id="title"
              placeholder="e.g. AI Mental Health App"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description Textarea */}
          <div>
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              placeholder="Briefly describe your product, problem it solves, and key features."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="resize-none max-h-40 overflow-y-auto"
            />
          </div>

          {/* Pitch Type Radio Group */}
          <div>
            <Label>Pitch Type</Label>
            <RadioGroup onValueChange={setType} className="mt-2" defaultValue="">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="elevator" id="elevator" />
                <Label htmlFor="elevator">Elevator</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="product" id="product" />
                <Label htmlFor="product">Product</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="others-type" />
                <Label htmlFor="others-type">Others</Label>
              </div>
            </RadioGroup>
            {type === "others" && (
              <Input
                className="mt-2"
                placeholder="Enter custom pitch type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                required
              />
            )}
          </div>

          {/* Tone Radio Group */}
          <div>
            <Label>Tone</Label>
            <RadioGroup onValueChange={setTone} className="mt-2" defaultValue="">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional">Professional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual">Casual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="others" id="others-tone" />
                <Label htmlFor="others-tone">Others</Label>
              </div>
            </RadioGroup>
            {tone === "others" && (
              <Input
                className="mt-2"
                placeholder="Enter custom tone"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                required
              />
            )}
          </div>
        </CardContent>
        {/*temporary text*/}
        <CardFooter className="flex flex-col items-stretch space-y-4 mt-4">
          <Button type="submit" className="bg-[#008080] hover:bg-[#008080] cursor-pointer active:bg-transparent active:text-[#008080]">Generate Pitch</Button>
          {generate && <p className="font-dancing text-[#008080] text-center ">Your pitch will be gnerated below</p>}
        </CardFooter>
      </form>
    </Card>

      {/*generated pitch displayed*/}
      { generate &&
          <Card className="w-full max-w-2xl mx-auto my-20 shadow-xl mt-0 p-4">
            <div className="bg-transparent border-[#008080] p-4 rounded-lg text-sm whitespace-pre-wrap border">
              {temp}
              <div className="flex justify-center items-center mt-2 space-x-2">
                <div className="w-4 h-4 border-2 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#008080] font-dancing font-bold">Generating Your Pitch, Please Wait</p>
              </div>
            </div>
          </Card> }
      { !generate && pitch &&
        <><Card className="w-full max-w-2xl mx-auto my-20 shadow-xl mt-0 p-4">
          <Textarea
              id="pitch"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="max-h-[66vh] overflow-y-auto"
            />
          <div className="flex justify-end mt-2">
              <p className="text-sm text-muted-foreground italic mr-4">Feel free to make edits before saving...</p>
              <Button onClick={savePitch} disabled={saving} className="h-8 px-3 text-sm bg-[#008080] hover:bg-[#008080] cursor-pointer active:bg-transparent active:text-[#008080]">
                {saving ? "Saving..." : "Save"}
              </Button>
        </div>
        </Card></>}
  </div>

  );
}
