"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft } from "lucide-react";

interface UserData {
  uid: string;
  email: string;
  name: string;
  role: string;
  photoURL?: string;
}

export default function AdminSettings() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // ✅ Cek login & role admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
          alert("Akses ditolak. Hanya admin yang bisa masuk.");
          router.replace("/");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Gagal memverifikasi admin:", err);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const list: UserData[] = querySnapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...(docSnap.data() as Omit<UserData, "uid">),
      }));
      setUsers(list);
    } catch (err) {
      console.error("Gagal memuat data pengguna:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  // ✅ Update role user
  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      fetchUsers();
    } catch (err) {
      alert("Gagal mengubah role pengguna.");
    }
  };

  // ✅ Hapus user
  const handleDelete = async (uid: string) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      fetchUsers();
    } catch (err) {
      alert("Gagal menghapus pengguna.");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="relative w-16 h-16">
          <div className="absolute w-full h-full rounded-full border-4 border-indigo-200"></div>
          <div className="absolute w-full h-full rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-700 text-lg font-medium">
          Memuat halaman admin...
        </p>
      </div>
    );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen p-6 text-gray-800 bg-gray-50 w-full">
      {/* 🔙 Button Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Kembali</span>
      </button>

      <h1 className="text-3xl font-bold mb-8 text-indigo-700">
        Admin Panel
      </h1>

      {/* Grid Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const initial =
            u.name?.trim()?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "?";

          return (
            <div
              key={u.uid}
              className="bg-white shadow-md rounded-lg p-5 flex flex-col items-center text-center hover:shadow-lg transition"
            >
              {u.photoURL ? (
                <img
                  src={u.photoURL}
                  alt={u.name || "User"}
                  className="w-20 h-20 rounded-full border mb-4 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold mb-4 border border-indigo-200">
                  {initial}
                </div>
              )}

              <h2 className="font-semibold text-lg">
                {u.name || "Tanpa Nama"}
              </h2>
              <p className="text-gray-500 text-sm mb-3">{u.email}</p>

              {/* 🎨 Styled Select */}
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm hover:bg-white transition mb-3"
              >
                <option value="dosen">👨‍🏫 Dosen</option>
                <option value="mahasiswa">🎓 Mahasiswa</option>
                <option value="admin">⭐ Admin</option>
              </select>

              <button
                onClick={() => handleDelete(u.uid)}
                className="bg-red-500 text-white px-4 py-1.5 rounded-full hover:bg-white hover:text-black transition-colors text-sm shadow cursor-pointer w-full"
              >
                Hapus
              </button>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 italic">
            Tidak ada user
          </div>
        )}
      </div>
    </div>
  );
}
