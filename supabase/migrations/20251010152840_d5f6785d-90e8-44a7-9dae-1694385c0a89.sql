-- Fix specialist verification and profile completeness for testing
UPDATE specialists 
SET verification_status = 'verified',
    years_experience = 5,
    bio = 'Experienced general practitioner with 5+ years in family medicine. Specializing in preventive care, routine checkups, and managing chronic conditions.',
    conditions_treated = ARRAY[
      'General consultation', 
      'Routine checkups', 
      'Minor illnesses', 
      'Preventive care',
      'Chronic disease management',
      'Health screenings'
    ],
    medical_school = 'Harvard Medical School',
    is_accepting_patients = true,
    video_consultation_enabled = true,
    in_person_enabled = true
WHERE user_id = 'e44a2161-9816-4827-bc51-2610fe9297ad';