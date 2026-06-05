
"use client";

import { AppLayout } from "./app-layout";
import { OverdueSchedule } from "./overdue-schedule";
import { NoticeBoard } from "./notice-board";

export default function DashboardPage() {
    return (
      <AppLayout title="Dashboard" description="Welcome back! Here's your overview for today.">
        <div className="grid gap-6 lg:grid-cols-1">
          <div className="lg:col-span-1 space-y-6">
            <OverdueSchedule />
            <NoticeBoard />
          </div>
        </div>
      </AppLayout>
    );
  }
