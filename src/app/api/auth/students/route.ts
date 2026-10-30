
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/require-role";

const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

// GET /api/students
export async function GET() {
  const auth = await requireRole([
    "ADMIN",
    "ENSEIGNANT",
    "ETUDIANT",
  ]);

  if (auth.response) return auth.response;

  // Un étudiant ne voit que ses propres informations.
  if (auth.user.role === "ETUDIANT") {
    return NextResponse.json([auth.user]);
  }

  // ADMIN et ENSEIGNANT peuvent consulter la liste.
  const students = await prisma.user.findMany({
    where: { role: "ETUDIANT" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(students);
}

// POST /api/students
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);

  if (auth.response) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createStudentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé" },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: "ETUDIANT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
