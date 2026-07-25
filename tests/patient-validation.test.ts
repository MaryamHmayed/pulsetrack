import assert from "node:assert/strict";
import test from "node:test";
import { validatePatientForm } from "@/lib/validation/patient";

function patientForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    fullName: "Test Patient",
    dob: "1985-04-12",
    sex: "FEMALE",
    mrn: "MRN-TEST-001",
    email: "test.patient@example.com",
    phone: "+15550101999",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

test("accepts and normalizes a valid patient", () => {
  const result = validatePatientForm(
    patientForm({
      mrn: "mrn-test-001",
      email: "TEST.Patient@Example.com",
    }),
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.mrn, "MRN-TEST-001");
    assert.equal(result.data.email, "test.patient@example.com");
    assert.equal(result.data.dob.toISOString(), "1985-04-12T00:00:00.000Z");
  }
});

test("rejects impossible and future dates", () => {
  const impossible = validatePatientForm(patientForm({ dob: "2026-02-30" }));
  const future = validatePatientForm(patientForm({ dob: "2999-01-01" }));

  assert.equal(impossible.success, false);
  assert.equal(future.success, false);
  if (!impossible.success && !future.success) {
    assert.ok(impossible.errors.dob);
    assert.ok(future.errors.dob);
  }
});

test("rejects invalid MRN, email, phone, and gender values", () => {
  const result = validatePatientForm(
    patientForm({
      mrn: "bad mrn!",
      email: "not-an-email",
      phone: "123",
      sex: "UNSUPPORTED",
    }),
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.mrn);
    assert.ok(result.errors.email);
    assert.ok(result.errors.phone);
    assert.ok(result.errors.sex);
  }
});

test("accepts only male and female gender values", () => {
  for (const sex of ["MALE", "FEMALE"]) {
    const result = validatePatientForm(patientForm({ sex }));
    assert.equal(result.success, true);
  }

  for (const sex of ["OTHER", "UNKNOWN"]) {
    const result = validatePatientForm(patientForm({ sex }));

    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(result.errors.sex, ["Select Male or Female."]);
    }
  }
});

test("requires every patient field", () => {
  const result = validatePatientForm(
    patientForm({
      fullName: "",
      dob: "",
      sex: "",
      mrn: "",
      email: "",
      phone: "",
    }),
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(Object.keys(result.errors).sort(), [
      "dob",
      "email",
      "fullName",
      "mrn",
      "phone",
      "sex",
    ]);
  }
});
