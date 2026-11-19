/** True when a student is allowed to use/apply to a hostel of this gender. */
export function hostelMatchesGender(
  hostelGender: string | undefined,
  studentGender: string | undefined
): boolean {
  // Don't hide anything when gender is unknown (e.g. guest/admin browsing).
  if (!hostelGender || !studentGender) return true;
  return hostelGender === 'OTHER' || hostelGender === studentGender;
}
