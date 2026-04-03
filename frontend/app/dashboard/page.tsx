"use client";

import { useEffect, useState } from "react";
import { SoapNoteCard } from "@/components/SoapNote";
import type { SOAPNote } from "@/lib/api";

/**
 * Doctor-facing summary dashboard.
 *
 * In MVP: receives the SOAP note from the patient page via localStorage key
 * "gastroflow_soap" which is set transiently and cleared immediately after
 * reading. In production, this would be a separate authenticated route
 * receiving data from the EHR handoff.
 */
export default function DashboardPage() {
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("gastroflow_soap");
    if (raw) {
      try {
        setSoap(JSON.parse(raw) as SOAPNote);
      } catch {
        // ignore malformed data
      }
      sessionStorage.removeItem("gastroflow_soap"); // clear immediately
    }
    setLoaded(true);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Clinician Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              GastroFlow — Patient Intake Summary
            </p>
          </div>
          <span className="text-xs bg-muted px-3 py-1 rounded-full border text-muted-foreground">
            Gastroenterology
          </span>
        </div>

        {loaded && !soap && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No intake summary available.</p>
            <p className="text-xs mt-1">
              Complete a patient intake on the{" "}
              <a href="/" className="text-primary underline underline-offset-2">
                intake page
              </a>{" "}
              to see the SOAP note here.
            </p>
          </div>
        )}

        {soap && <SoapNoteCard soap={soap} />}
      </div>
    </main>
  );
}
