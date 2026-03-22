export const JOB_CATEGORIES = {
  "Web Development": [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "WordPress",
  ],
  Design: ["Graphic Design", "UI/UX Design", "Logo Design", "Video Editing"],
  Writing: ["Content Writing", "Copywriting", "Technical Writing", "Translation"],
  Marketing: ["Social Media", "SEO", "Paid Ads", "Brand Strategy"],
  "Home Services": ["Plumbing", "Electrical", "Cleaning", "Repairs"],
  Delivery: ["Food Delivery", "Courier Delivery", "Parcel Pickup"],
  Transport: ["Ride Service", "Goods Transport", "Vehicle Rental"],
  "Data Work": ["Data Entry", "Data Labeling", "Spreadsheet Work", "Data Cleaning"],
  Education: ["Tutoring", "Course Creation", "Exam Prep", "Language Coaching"],
  "Professional Services": ["Legal", "Accounting", "Consulting", "HR Services"],
};

export const LOCAL_SERVICE_CATEGORIES = new Set([
  "Home Services",
  "Delivery",
  "Transport",
]);

export const GIG_STATUSES = ["open", "pending", "accepted", "in-progress", "completed"];

export const ALLOWED_STATUS_TRANSITIONS = {
  open: ["pending", "accepted"],
  pending: ["accepted", "open"],
  accepted: ["in-progress", "open"],
  "in-progress": ["completed"],
  completed: [],
};

export const WORK_TYPES = ["Freelancer", "Shop Owner", "Temporary"];