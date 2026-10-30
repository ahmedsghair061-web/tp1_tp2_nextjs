
import { redirect } from "next/navigation";
import { prisma } from "../lib/prisma";
import { getSession } from "../lib/session";
import LogoutButton from "../components/LogoutButton";
import StudentsManager from "../components/StudentsManager";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (
    !["ADMIN", "ENSEIGNANT", "ETUDIANT"].includes(user.role)
  ) {
    redirect("/login");
  }

  const role = user.role as "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

  const roleLabels = {
    ADMIN: "Administrateur",
    ENSEIGNANT: "Enseignant",
    ETUDIANT: "Étudiant",
  };

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour {user.name} !
          </h1>
          <p className="text-gray-600">
            Bienvenue dans votre espace personnel.
          </p>
        </div>

        <LogoutButton />
      </header>

      <section className="rounded-lg border p-5">
        <h2 className="mb-3 text-lg font-semibold">
          Mon profil
        </h2>

        <p>Email : {user.email}</p>
        <p>Rôle : {roleLabels[role]}</p>
        <p>
          Inscrit le :{" "}
          {user.createdAt.toLocaleDateString("fr-FR")}
        </p>
      </section>

      <StudentsManager role={role} />
    </main>
  );
}
