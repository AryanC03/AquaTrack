import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DayOfWeek } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDayOfWeek = (date: Date): DayOfWeek => {
  const dayIndex = date.getDay();
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

/**
 * Gets the date for the most recent occurrence of a given day of the week.
 * For example, if today is Wednesday and 'Monday' is passed, it returns the date of this week's Monday.
 * If today is Monday and 'Wednesday' is passed, it returns the date of last week's Wednesday.
 * @param dayOfWeek The target day of the week.
 * @returns A Date object set to the most recent occurrence of that day.
 */
export const getDateForDayOfWeek = (dayOfWeek: DayOfWeek): Date => {
  const dayMap: { [key in DayOfWeek]: number } = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const targetDay = dayMap[dayOfWeek];
  const today = new Date();
  const currentDay = today.getDay();
  // if current day is sunday (0), treat as 7 for calculation
  const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;
  const adjustedTargetDay = targetDay === 0 ? 7 : targetDay;

  let dayDifference = adjustedCurrentDay - adjustedTargetDay;

  const resultDate = new Date(today);
  resultDate.setDate(today.getDate() - dayDifference);

  // Set time to noon to avoid any timezone-related date shifts near midnight
  resultDate.setHours(12, 0, 0, 0);

  return resultDate;
};
