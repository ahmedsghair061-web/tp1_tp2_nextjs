
"use client";

import { useEffect, useState } from "react";

type Student = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Props = {
  role: "ADMIN" | "ENSEIGNANT" | "ETUDIANT";
};

export default function StudentsManager({ role }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStudents() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/students");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Erreur HTTP ${res.status}`);
        return;
      }

      setStudents(data);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  async function createStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Erreur HTTP ${res.status}`);
        return;
      }

      setMessage("Étudiant créé avec succès.");
      setName("");
      setEmail("");
      setPassword("");
      await loadStudents();
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  }

  async function updateStudent(student: Student) {
    const newName = window.prompt(
      "Nouveau nom de l'étudiant :",
      student.name
    );

    if (newName === null || !newName.trim()) return;

    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Erreur HTTP ${res.status}`);
        return;
      }

      setMessage("Étudiant modifié avec succès.");
      await loadStudents();
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  }

  async function deleteStudent(student: Student) {
    if (!window.confirm(`Supprimer ${student.name} ?`)) return;

    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Erreur HTTP ${res.status}`);
        return;
      }

      setMessage("Étudiant supprimé.");
      await loadStudents();
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  }

  return (
    <section className="mt-8 space-y-5">
      <h2 className="text-xl font-bold">
        {role === "ETUDIANT"
          ? "Mes informations"
          : "Gestion des étudiants"}
      </h2>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-red-800">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded bg-green-100 p-3 text-green-800">
          {message}
        </p>
      )}

      {role === "ADMIN" && (
        <form onSubmit={createStudent} className="space-y-3 rounded border p-4">
          <h3 className="font-semibold">Créer un étudiant</h3>

          <input
            className="w-full rounded border p-2"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />

          <input
            className="w-full rounded border p-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full rounded border p-2"
            type="password"
            placeholder="Mot de passe (8 caractères minimum)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <button
            className="rounded bg-blue-600 px-4 py-2 text-white"
            type="submit"
          >
            Ajouter
          </button>
        </form>
      )}

      {loading ? (
        <p>Chargement des étudiants...</p>
      ) : students.length === 0 ? (
        <p>Aucun étudiant trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Nom</th>
                <th className="border p-2 text-left">Email</th>
                {role !== "ETUDIANT" && (
                  <th className="border p-2">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="border p-2">{student.name}</td>
                  <td className="border p-2">{student.email}</td>

                  {role !== "ETUDIANT" && (
                    <td className="space-x-2 border p-2 text-center">
                      <button
                        className="rounded bg-amber-500 px-3 py-1 text-white"
                        onClick={() => updateStudent(student)}
                      >
                        Modifier
                      </button>

                      {role === "ADMIN" && (
                        <button
                          className="rounded bg-red-600 px-3 py-1 text-white"
                          onClick={() => deleteStudent(student)}
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
