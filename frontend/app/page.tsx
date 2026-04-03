"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { SoapNoteCard } from "@/components/SoapNote";
import type { SOAPNote } from "@/lib/api";

export default function PatientIntakePage() {
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [key, setKey] = useState(0); // remount chat to start fresh

  function handleComplete(generatedSoap: SOAPNote) {
    setSoap(generatedSoap);
    // Make available to doctor dashboard via sessionStorage (cleared on read)
    sessionStorage.setItem("gastroflow_soap", JSON.stringify(generatedSoap));
  }

  function handleNewIntake() {
    setSoap(null);
    setKey((k: number) => k + 1); // remount ChatInterface → new session
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">GastroFlow</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            AI-assisted gastroenterology pre-appointment intake
          </p>
        </div>

        {/* Privacy notice */}
        {!soap && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-700">
            <strong>Privacy:</strong> This conversation is processed with zero data retention.
            No information is stored after your intake is complete.
          </div>
        )}

        {/* Main content */}
        {soap ? (
          <SoapNoteCard soap={soap} onNewIntake={handleNewIntake} />
        ) : (
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <ChatInterface key={key} onComplete={handleComplete} />
          </div>
        )}
      </div>
    </main>
  );
}
