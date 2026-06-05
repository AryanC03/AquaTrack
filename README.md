# AquaTrack: AI-Powered Swim School Management System

**AquaTrack** is a centralized, real-time platform designed to streamline swim school operations for Aquatics Service Officers (ASOs) and managers. It replaces legacy spreadsheet-based workflows with an intuitive, automated system for tracking student assessments, managing class demand, and providing AI-driven coaching support.

## Project Overview for Resume

### **AquaTrack | Full-Stack Web Application**
*Developed a high-performance management system to automate swim school logistics and student progression tracking.*

- **Automated Assessment Tracking:** Built a dynamic scheduling system that flags overdue assessments based on configurable business logic, ensuring timely student evaluations.
- **AI-Driven Support:** Integrated Google Gemini (via Genkit) to generate real-time coaching drills for instructors and automated summaries for staff notice boards.
- **Robust Data Import Engine:** Engineered a multi-format import system (CSV/JSON) with AI-assisted parsing to automate the migration of complex class schedules.
- **Real-Time Data Architecture:** Leveraged Firestore real-time listeners to provide seamless, multi-user synchronization across assessments, waitlists, and mentor requests.
- **Enterprise-Grade Security:** Implemented Firebase App Check (reCAPTCHA v3) and custom Firestore Security Rules to protect sensitive student and operational data.

## Technical Stack

- **Framework:** Next.js 15 (App Router), React 18, TypeScript.
- **Styling & UI:** Tailwind CSS, ShadCN UI, Lucide Icons.
- **Backend & Database:** Firebase (Firestore NoSQL, Firebase Authentication).
- **Security:** Firebase App Check (reCAPTCHA v3).
- **Generative AI:** Genkit with Google Gemini 2.0 Flash for summarization and coaching logic.
- **State Management:** React Context API and custom hooks for real-time Firestore synchronization.
- **Deployment:** Firebase App Hosting.

---

## Core Features

### 1. Assessments Management
- **Daily Scheduling:** Displays class assessments organized by day of the week with fixed timetable blocks.
- **Status Tracking:** Automatically flags assessments as `Overdue` based on a user-defined threshold (default 4 weeks).
- **Manual Overrides:** Allows ASOs to manually set assessment dates via an integrated calendar popover.

### 2. Class Demand & Waitlist
- Centralized tracking for prospective students organized by level and preferred time.
- Searchable and sortable list to optimize class scheduling based on real-time demand.

### 3. Mentor Support & AI Coaching
- Instructors can request support for specific teaching challenges.
- **AI Feature:** Generates actionable coaching suggestions, drills, and games tailored to the specific class level and problem description.

### 4. Admin & Settings
- **AI-Powered Import:** Upload CSV or JSON files to bulk-import class schedules and automatically generate corresponding assessment records.
- **Dynamic Configuration:** Adjust global settings for overdue thresholds and manage the authorized assessor list.
