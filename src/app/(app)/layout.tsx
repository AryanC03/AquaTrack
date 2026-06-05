
"use client";

import { Sidebar } from '@/components/dashboard/sidebar';
import { AssessorProvider } from '@/context/assessor-context';
import { SettingsProvider } from '@/context/settings-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AssessorProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex flex-col flex-1 sm:pl-14">
            <main className="flex-1 flex flex-col relative">
                {children}
            </main>
          </div>
        </div>
      </AssessorProvider>
    </SettingsProvider>
  );
}
