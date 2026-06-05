
"use client";

import { AppLayout } from "./app-layout";
import { OverdueSchedule } from "./overdue-schedule";
import { NoticeBoard } from "./notice-board";

export default function DashboardPage() {
    return (
      <AppLayout title="Dashboard" description="Welcome back! Here's your overview for today.">
        <div className="grid gap-6 lg:grid-cols-2 min-h-[calc(100vh-6rem)]">
          <div className="space-y-6 h-full">
            <OverdueSchedule />
          </div>
          <div className="space-y-6 h-full">
            <NoticeBoard />
          </div>
        </div>
      </AppLayout>
    );
  }
