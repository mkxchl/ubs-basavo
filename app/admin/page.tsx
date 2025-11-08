"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

interface UserProfile {
  role: string;
}

interface StatCardProps {
  title: string;
  value: string;
  color: "blue" | "green" | "orange";
}

interface CardMenuProps {
  title: string;
  desc: string;
  link: string;
  color: "blue" | "green" | "purple";
}

export default function AdminDashboard() {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const userProfile = snap.data() as UserProfile;
          setRole(userProfile.role);
        } else {
          setRole("user");
        }

        // 🔔 Tampilkan toast hanya sekali per session
        const hasShown = sessionStorage.getItem("loginAlertShown");
        if (!hasShown && u) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: `Selamat datang ${u.displayName || u.email || "User"} 👋`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          sessionStorage.setItem("loginAlertShown", "true");
        }
      } catch (error) {
        console.error("Gagal memuat role:", error);
        Swal.fire("Error", "Gagal memuat informasi pengguna.", "error");
      } finally {
        setLoadingUser(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("loginAlertShown");
      Swal.fire("Logout", "Anda telah keluar dari sistem.", "info");
      router.push("/login");
    } catch (error) {
      Swal.fire("Error", "Gagal melakukan logout.", "error");
    }
  };

  if (loadingUser)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Memuat data pengguna...
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-xl font-bold text-blue-700">🏅 UKM Olahraga</h1>
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={`${user.photoURL}?sz=100`}
                alt="User profile"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full"
              />
            ) : (
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-sm text-white">
                {user.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="text-gray-700 font-medium">
              {user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Dashboard {role && `(${role})`}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard title="Jumlah Anggota" value="42" color="blue" />
          <StatCard title="Total Kas" value="Rp 2.450.000" color="green" />
          <StatCard title="Jadwal Aktif" value="5" color="orange" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardMenu
            title="📅 Jadwal Latihan"
            desc="Lihat dan atur jadwal kegiatan latihan."
            link="/jadwal"
            color="blue"
          />
          <CardMenu
            title="👥 Data Anggota"
            desc="Kelola daftar anggota UKM olahraga."
            link="/member"
            color="green"
          />
          <CardMenu
            title="💰 Data Kas"
            desc="Lihat pemasukan dan pengeluaran kas."
            link="/kas"
            color="purple"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }: StatCardProps) {
  const colorMap = {
    blue: "text-blue-700",
    green: "text-green-600",
    orange: "text-orange-500",
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <h3 className="text-gray-500 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function CardMenu({ title, desc, link, color }: CardMenuProps) {
  const colorMap = {
    blue: "border-blue-500 hover:bg-blue-50",
    green: "border-green-500 hover:bg-green-50",
    purple: "border-purple-500 hover:bg-purple-50",
  };
  return (
    <a
      href={link}
      className={`block p-6 rounded-xl shadow bg-white border-l-4 transition ${colorMap[color]}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </a>
  );
}
