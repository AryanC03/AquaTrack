// This file is now deprecated as we are using Firestore.
// It is kept for reference but is not used in the application.

import { subWeeks, subDays, addDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { getDayOfWeek } from './utils';
import type { Assessment, MissedAssessment, WaitlistEntry, MentorSupportEntry, DayOfWeek, ClassEntry } from './types';

const now = new Date();
const nowTimestamp = Timestamp.fromDate(now);

const createTimestamp = (date: Date) => Timestamp.fromDate(date);
