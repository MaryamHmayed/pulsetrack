export const GENDER_OPTIONS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
] as const;

export type PatientSex = (typeof GENDER_OPTIONS)[number]["value"];

export type PatientFormValues = {
  fullName: string;
  dob: string;
  sex: string;
  mrn: string;
  email: string;
  phone: string;
};

export type PatientField = keyof PatientFormValues;

export type PatientFormState = {
  errors?: Partial<Record<PatientField, string[]>>;
  message?: string;
  values?: PatientFormValues;
};

export type ValidPatientInput = {
  fullName: string;
  dob: Date;
  sex: PatientSex;
  mrn: string;
  email: string;
  phone: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MRN_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readText(formData: FormData, field: PatientField) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function parseDateOnly(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

export function validatePatientForm(formData: FormData):
  | { success: true; data: ValidPatientInput; values: PatientFormValues }
  | {
      success: false;
      errors: Partial<Record<PatientField, string[]>>;
      values: PatientFormValues;
    } {
  const values: PatientFormValues = {
    fullName: readText(formData, "fullName"),
    dob: readText(formData, "dob"),
    sex: readText(formData, "sex").toUpperCase(),
    mrn: readText(formData, "mrn").toUpperCase(),
    email: readText(formData, "email").toLowerCase(),
    phone: readText(formData, "phone"),
  };
  const errors: Partial<Record<PatientField, string[]>> = {};

  if (values.fullName.length < 2 || values.fullName.length > 100) {
    errors.fullName = ["Full name must be between 2 and 100 characters."];
  } else if (/[\u0000-\u001F\u007F]/.test(values.fullName)) {
    errors.fullName = ["Full name contains invalid characters."];
  }

  const dob = parseDateOnly(values.dob);
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const oldestAllowed = new Date(todayUtc);
  oldestAllowed.setUTCFullYear(oldestAllowed.getUTCFullYear() - 130);

  if (!dob) {
    errors.dob = ["Enter a valid date of birth."];
  } else if (dob > todayUtc) {
    errors.dob = ["Date of birth cannot be in the future."];
  } else if (dob < oldestAllowed) {
    errors.dob = ["Date of birth cannot be more than 130 years ago."];
  }

  const validSex = GENDER_OPTIONS.some(
    (option) => option.value === values.sex,
  );
  if (!validSex) {
    errors.sex = ["Select Male or Female."];
  }

  if (!MRN_PATTERN.test(values.mrn)) {
    errors.mrn = [
      "MRN must be 3–32 characters using uppercase letters, numbers, or hyphens.",
    ];
  }

  if (
    values.email.length > 254 ||
    !EMAIL_PATTERN.test(values.email)
  ) {
    errors.email = ["Enter a valid email address."];
  }

  if (!PHONE_PATTERN.test(values.phone)) {
    errors.phone = ["Enter a valid phone number."];
  }

  if (Object.keys(errors).length > 0 || !dob || !validSex) {
    return { success: false, errors, values };
  }

  return {
    success: true,
    values,
    data: {
      fullName: values.fullName,
      dob,
      sex: values.sex as PatientSex,
      mrn: values.mrn,
      email: values.email,
      phone: values.phone,
    },
  };
}
