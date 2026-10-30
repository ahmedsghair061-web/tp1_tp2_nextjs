
import { NextResponse } from "next/server";
import { prisma } from "../lib/prisma";
import { getSession } from "../lib/session";

export type Role = "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export async function requireRole(rolesAutorises: Role[]) {
  const session = await getSession();

  if (!session) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 401 }
      ),
    };
  }

  if (!rolesAutorises.includes(user.role as Role)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Accès interdit" },
        { status: 403 }
      ),
    };
  }

  return {
    user: user as AuthenticatedUser,
    response: null,
  };
}
