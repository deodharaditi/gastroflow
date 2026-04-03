"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { SoapNoteCard } from "@/components/SoapNote";
import type { SOAPNote } from "@/lib/api";

export default function PatientIntakePage() {
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [key, setKey]   = useState(0);

  function handleComplete(generatedSoap: SOAPNote) {
    setSoap(generatedSoap);
  }

  function handleNewIntake() {
    setSoap(null);
    setKey((k: number) => k + 1);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-black">G</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">GastroFlow</p>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                Gastroenterology Intake
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-muted-foreground">Zero data retention</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {soap ? (
          <>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">Intake Summary</h2>
              <p className="text-xs text-muted-foreground">
                Review the AI-generated SOAP note below. This is for clinician use only.
              </p>
            </div>
            <SoapNoteCard soap={soap} onNewIntake={handleNewIntake} />
          </>
        ) : (
          <>
            {/* Privacy notice */}
            <div className="mb-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <span className="text-blue-500 mt-0.5">🔒</span>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Your privacy is protected.</strong> This conversation is processed with
                zero data retention. Nothing is stored on our servers after your summary is generated.
              </p>
            </div>

            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <ChatInterface key={key} onComplete={handleComplete} />
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-4">
              For medical emergencies, call <strong>911</strong> immediately.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
