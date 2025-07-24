"use client";
import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ResponsiveCalendarProps = {
  value: Date;
  onChange: (date: Date) => void;
};

export default function ResponsiveCalendar({ value, onChange }: ResponsiveCalendarProps) {
  return (
    <div className="w-full flex justify-center overflow-x-auto">
      <Calendar
        onChange={onChange}
        value={value}
        className="bg-white rounded-lg shadow p-2"
        tileClassName={({ date, view }) =>
          ""
        }
      />
    </div>
  );
} 