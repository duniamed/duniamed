export const MEDICAL_SPECIALTIES = [
  // Primary Care
  "General Practice / Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Geriatrics",
  
  // Surgical Specialties
  "General Surgery",
  "Cardiothoracic Surgery",
  "Neurosurgery",
  "Orthopedic Surgery",
  "Plastic Surgery",
  "Vascular Surgery",
  "Colorectal Surgery",
  "Transplant Surgery",
  "Trauma Surgery",
  "Pediatric Surgery",
  
  // Medical Specialties
  "Cardiology",
  "Pulmonology",
  "Gastroenterology",
  "Nephrology",
  "Endocrinology",
  "Rheumatology",
  "Hematology",
  "Oncology",
  "Infectious Disease",
  "Allergy and Immunology",
  
  // Neurosciences
  "Neurology",
  "Psychiatry",
  "Child and Adolescent Psychiatry",
  "Neuropsychiatry",
  
  // Women's Health
  "Obstetrics and Gynecology",
  "Maternal-Fetal Medicine",
  "Reproductive Endocrinology",
  "Gynecologic Oncology",
  "Urogynecology",
  
  // Diagnostics & Imaging
  "Radiology",
  "Nuclear Medicine",
  "Interventional Radiology",
  "Diagnostic Radiology",
  
  // Laboratory Medicine
  "Pathology",
  "Clinical Pathology",
  "Anatomical Pathology",
  "Molecular Pathology",
  
  // Anesthesia & Pain
  "Anesthesiology",
  "Pain Medicine",
  "Critical Care Medicine",
  
  // Emergency & Urgent Care
  "Emergency Medicine",
  "Urgent Care Medicine",
  "Disaster Medicine",
  
  // Ear, Nose & Throat
  "Otolaryngology (ENT)",
  "Head and Neck Surgery",
  
  // Eye Care
  "Ophthalmology",
  "Retinal Surgery",
  "Oculoplastic Surgery",
  
  // Skin
  "Dermatology",
  "Dermatopathology",
  "Cosmetic Dermatology",
  "Pediatric Dermatology",
  
  // Urinary & Reproductive
  "Urology",
  "Pediatric Urology",
  "Urologic Oncology",
  
  // Musculoskeletal
  "Physical Medicine and Rehabilitation",
  "Sports Medicine",
  "Orthopedic Sports Medicine",
  
  // Child Health
  "Neonatology",
  "Pediatric Cardiology",
  "Pediatric Endocrinology",
  "Pediatric Gastroenterology",
  "Pediatric Hematology-Oncology",
  "Pediatric Nephrology",
  "Pediatric Pulmonology",
  "Developmental-Behavioral Pediatrics",
  
  // Mental Health
  "Clinical Psychology",
  "Counseling Psychology",
  "Neuropsychology",
  "Addiction Psychiatry",
  "Forensic Psychiatry",
  
  // Allied Health Professions
  "Nursing (RN)",
  "Nurse Practitioner",
  "Physician Assistant",
  "Clinical Nurse Specialist",
  "Physiotherapy / Physical Therapy",
  "Occupational Therapy",
  "Speech-Language Pathology",
  "Audiology",
  "Respiratory Therapy",
  "Nutrition / Dietetics",
  "Clinical Social Work",
  "Genetic Counseling",
  
  // Dentistry
  "General Dentistry",
  "Orthodontics",
  "Periodontics",
  "Endodontics",
  "Oral and Maxillofacial Surgery",
  "Prosthodontics",
  "Pediatric Dentistry",
  
  // Alternative & Complementary
  "Integrative Medicine",
  "Palliative Care",
  "Hospice and Palliative Medicine",
  "Sleep Medicine",
  "Preventive Medicine",
  "Occupational Medicine",
  "Aerospace Medicine",
  "Telemedicine",
  
  // Other
  "Medical Genetics",
  "Clinical Pharmacology",
  "Public Health",
  "Tropical Medicine",
  "Undersea and Hyperbaric Medicine",
] as const;

export const CLINIC_TYPES = [
  // General
  "General Medical Clinic",
  "Multi-Specialty Clinic",
  "Family Practice Clinic",
  "Walk-In Clinic",
  "Urgent Care Center",
  
  // Specialized
  "Cardiology Clinic",
  "Orthopedic Clinic",
  "Dermatology Clinic",
  "ENT Clinic",
  "Eye Clinic / Ophthalmology",
  "Dental Clinic",
  "Pain Management Clinic",
  "Physical Therapy / Rehabilitation Center",
  "Sports Medicine Clinic",
  "Women's Health Clinic",
  "Pediatric Clinic",
  "Geriatric Clinic",
  
  // Mental Health
  "Mental Health Clinic",
  "Psychiatric Clinic",
  "Substance Abuse Treatment Center",
  "Behavioral Health Center",
  
  // Diagnostic & Treatment
  "Diagnostic Imaging Center",
  "Laboratory / Pathology Center",
  "Infusion Center",
  "Dialysis Center",
  "Cancer Treatment Center / Oncology",
  "Radiation Oncology Center",
  
  // Surgical
  "Ambulatory Surgical Center",
  "Day Surgery Center",
  
  // Specialty Care
  "Sleep Clinic",
  "Allergy and Immunology Clinic",
  "Endocrinology Clinic",
  "Fertility / IVF Clinic",
  "Weight Management Clinic",
  "Wound Care Center",
  "Travel Medicine Clinic",
  
  // Hospital-Based
  "Hospital Outpatient Department",
  "Emergency Department",
  "Community Health Center",
  "Teaching Hospital Clinic",
  
  // Alternative & Integrative
  "Integrative Medicine Center",
  "Wellness Center",
  "Occupational Health Clinic",
  
  // Telemedicine
  "Virtual Care Clinic",
  "Hybrid Clinic (Physical + Virtual)",
] as const;

export const SPECIALIST_TYPES = [
  { value: "physician", label: "Physician (MD/DO)" },
  { value: "psychologist", label: "Psychologist" },
  { value: "nurse", label: "Registered Nurse / Nurse Practitioner" },
  { value: "physiotherapist", label: "Physiotherapist / Physical Therapist" },
  { value: "dentist", label: "Dentist" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "therapist", label: "Therapist (OT/Speech/etc.)" },
  { value: "nutritionist", label: "Nutritionist / Dietitian" },
  { value: "other", label: "Other Healthcare Professional" },
] as const;
