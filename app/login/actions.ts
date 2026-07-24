"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

const DUMMY_PASSWORD_HASH =
  "$2b$10$qsJLxP2r1HPoTp6jeaCmMuZxHhSMQnJYSroKHWYz1KGIT4zK.5Uq.";

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !email.includes("@") || password.length < 8) {
    return { error: "Enter a valid email and password." };
  }

  const clinician = await db.clinician.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  const passwordMatches = await bcrypt.compare(
    password,
    clinician?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!clinician || !passwordMatches) {
    return { error: "Invalid email or password." };
  }

  await createSession(clinician.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
