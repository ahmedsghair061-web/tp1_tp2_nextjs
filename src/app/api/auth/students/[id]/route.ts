
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/require-role";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateStudentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
}).strict().refine(
  (data) => data.name !== undefined || data.email !== undefined,
  { message: "Aucune modification fournie" }
);

// PATCH /api/students/[id]
export async function PATCH(
  req: Request,
  context: RouteContext
) {
  const auth = await requireRole(["ADMIN", "ENSEIGNANT"]);

  if (auth.response) return auth.response;

  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Identifiant invalide" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateStudentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // L'enseignant peut uniquement modifier le nom.
  if (
    auth.user.role === "ENSEIGNANT" &&
    (parsed.data.email !== undefined)
  ) {
    return NextResponse.json(
      { error: "L'enseignant ne peut modifier que le nom" },
      { status: 403 }
    );
  }

  const student = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!student || student.role !== "ETUDIANT") {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    throw error;
  }
}

// DELETE /api/students/[id]
export async function DELETE(
  _req: Request,
  context: RouteContext
) {
  const auth = await requireRole(["ADMIN"]);

  if (auth.response) return auth.response;

  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Identifiant invalide" },
      { status: 400 }
    );
  }

  const student = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!student || student.role !== "ETUDIANT") {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "Étudiant supprimé" });
}
