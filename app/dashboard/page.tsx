"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
  User as FirebaseAuthUser,
} from "firebase/auth";
import {
  onSnapshot,
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  addDoc,
  deleteDoc,
  updateDoc,
  getCountFromServer,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { LogOut } from "lucide-react";
import { Timer } from "lucide-react";
import { X } from "lucide-react";
import { Plus } from "lucide-react";
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
interface KasItem {
  id: string;
  jenis: "pemasukan" | "pengeluaran";
  jumlah: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editJadwal, setEditJadwal] = useState<any>(null);
  const [totalJadwal, setTotalJadwal] = useState<number>(0);
  const [totalAnggota, setTotalAnggota] = useState(0);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [newJadwal, setNewJadwal] = useState({
    kegiatan: "",
    tanggal: "",
    waktu: "",
    lokasi: "",
    sport: "",
    dibuatPada: "",
    dibuatOleh: "",
  });

  const router = useRouter();
  useEffect(() => {
    document.title = "Dashboard Basavo";
  }, []);

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "members"), (snap) => {
      setTotalAnggota(snap.size);
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "kas"), (snap) => {
      const data = snap.docs.map((d) => d.data()) as KasItem[];
      const totalPemasukan = data
        .filter((i) => i.jenis === "pemasukan")
        .reduce((sum, i) => sum + i.jumlah, 0);
      const totalPengeluaran = data
        .filter((i) => i.jenis === "pengeluaran")
        .reduce((sum, i) => sum + i.jumlah, 0);
      setTotalSaldo(totalPemasukan - totalPengeluaran);
    });
    return () => unsub();
  }, []);

  // 🔹 Ambil jadwal real-time
  useEffect(() => {
    const q = query(collection(db, "jadwal"), orderBy("tanggal", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setJadwal(data);
      setTotalJadwal(data.length);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "jadwal"), orderBy("tanggal", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setJadwal(data);
      setTotalJadwal(data.length);
    });

    return () => unsub();
  }, []);

  const handleEdit = (item: any) => {
    setEditJadwal(item);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (
      !editJadwal.namaKegiatan ||
      !editJadwal.tanggal ||
      !editJadwal.waktu ||
      !editJadwal.lokasi
    ) {
      alert("❌ Semua field wajib diisi!");
      return;
    }

    try {
      const docRef = doc(db, "jadwal", editJadwal.id);
      await updateDoc(docRef, {
        namaKegiatan: editJadwal.namaKegiatan,
        tanggal: editJadwal.tanggal,
        waktu: editJadwal.waktu,
        lokasi: editJadwal.lokasi,
        sport: editJadwal.sport,
      });
      alert("✅ Jadwal berhasil diperbarui!");
      setShowEditModal(false);
      setEditJadwal(null);
    } catch (error) {
      alert("❌ Gagal memperbarui jadwal.");
      console.error(error);
    }
  };

  const handleTambahJadwal = async () => {
    if (!newJadwal.kegiatan || !newJadwal.tanggal || !newJadwal.waktu) {
      alert("Semua field wajib diisi!");
      return;
    }
    try {
      const docRef = collection(db, "jadwal");
      await addDoc(docRef, {
        ...newJadwal,
        dibuatOleh: user?.displayName || user?.email,
        dibuatPada: new Date(),
      });

      setShowModal(false);
      setNewJadwal({
        kegiatan: "",
        tanggal: "",
        waktu: "",
        lokasi: "",
        sport: "",
        dibuatPada: "",
        dibuatOleh: "",
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Jadwal berhasil di tambahkan`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Gagal menambah jadwal:", err);
      alert("Gagal menambah jadwal, coba lagi!");
    }
  };
  const handleDeleteJadwal = async (id: string) => {
    if (role !== "admin") {
      Swal.fire(
        "Akses Ditolak",
        "Hanya admin yang bisa menghapus jadwal.",
        "error"
      );
      return;
    }
    const confirm = await Swal.fire({
      title: "Hapus Jadwal?",
      text: "Data jadwal ini akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(doc(db, "jadwal", id));
        setJadwal((prev) => prev.filter((item) => item.id !== id));
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Data terhapus`,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      } catch (err) {
        console.error("Gagal menghapus jadwal:", err);
        Swal.fire("Error", "Gagal menghapus jadwal, coba lagi.", "error");
      }
    }
  };
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar dari sistem?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#d33",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await signOut(auth);
      sessionStorage.removeItem("loginAlertShown");
      await Swal.fire({
        icon: "success",
        title: "Berhasil Logout",
        text: "Anda telah keluar dari sistem.",
        confirmButtonColor: "#3B82F6",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      router.push("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Logout",
        text: "Terjadi kesalahan saat keluar dari sistem.",
        confirmButtonColor: "#d33",
      });
    }
  };
  if (loadingUser)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 bg-repeat p-4">
        {/* Spinner animasi elegan */}
        <div className="relative w-16 h-16">
          <div className="absolute w-full h-full rounded-full border-4 border-blue-200"></div>
          <div className="absolute w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        <p className="mt-6 text-gray-700 text-lg font-medium flex items-center gap-2">
          <span>Memuat data pengguna...</span>
        </p>

        <div className="mt-4 w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>

        {/* Animasi tambahan */}
        <style jsx>{`
          @keyframes loading {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  if (!user) return null;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl font-bold text-blue-700">Basavo</h1>
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={`${user.photoURL}?sz=100`}
              alt="User profile"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full"
            />
          ) : (
            <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <span className="hidden sm:inline text-gray-700 font-medium">
            {user?.displayName || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-blue-400 px-3 py-1 rounded-md transition sm:px-3 sm:py-1"
          >
            <span className="hidden sm:inline">Keluar</span>
            <LogOut className="sm:hidden w-5 h-5 cursor-pointer" />
          </button>
        </div>
      </div>
    </header>

      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard</h2>

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Timer /> Jadwal Latihan
          </h3>

          {role === "admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
            >
              <span className="text-lg font-bold"><Plus /></span> Tambah Jadwal
            </button>
          )}

          {jadwal.length === 0 ? (
            <p className="text-gray-500">Belum ada jadwal latihan.</p>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow">
              {jadwal.slice(0, 3).map((item) => (
                <li
                  key={item.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.kegiatan}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      • {item.waktu}
                    </p>
                    <p className="text-sm text-gray-600">📍 {item.lokasi}</p>
                    <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                      Dibuat Oleh : {item.dibuatOleh}
                    </span>
                  </div>
                  {role === "admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="cursor-pointer px-3 py-1 text-sm bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200 rounded-lg transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJadwal(item.id)}
                        className="cursor-pointer px-3 py-1 text-sm bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 rounded-lg transition-all"
                      >
                        🗑 Hapus
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {role === "admin" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 mt-10">
            <StatCard
              title="Jumlah Anggota"
              value={`${totalAnggota}`}
              color="blue"
            />
            <StatCard
              title="Total Kas"
              value={`Rp: ${totalSaldo}`}
              color="green"
            />
            <StatCard
              title="Jadwal Aktif"
              value={`${totalJadwal}`}
              color="orange"
            />
          </div>
        )}
        {role === "admin" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardMenu
              title="👥 Data Anggota"
              desc="Kelola daftar anggota UKM olahraga."
              link="/dashboard/member"
              color="green"
            />
            <CardMenu
              title="💰 Data Kas"
              desc="Lihat pemasukan dan pengeluaran kas."
              link="dashboard/kas"
              color="purple"
            />
            <CardMenu
              title="💰 Data Contact"
              desc="Lihat contact pesan masuk."
              link="dashboard/contact"
              color="purple"
            />
          </div>
        )}
      </main>

      {showModal && role === "admin" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-95 animate-scaleIn">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800">
                Tambah Jadwal Latihan
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 text-2xl font-bold cursor-pointer transition"
                title="Tutup"
              >
                <X />
              </button>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="Nama Kegiatan"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newJadwal.kegiatan}
                onChange={(e) =>
                  setNewJadwal({ ...newJadwal, kegiatan: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newJadwal.tanggal}
                onChange={(e) =>
                  setNewJadwal({ ...newJadwal, tanggal: e.target.value })
                }
              />
              <input
                type="time"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newJadwal.waktu}
                onChange={(e) =>
                  setNewJadwal({ ...newJadwal, waktu: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Lokasi"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newJadwal.lokasi}
                onChange={(e) =>
                  setNewJadwal({ ...newJadwal, lokasi: e.target.value })
                }
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleTambahJadwal}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all"
              >
                Simpan
              </button>
              
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <ModalJadwal
          title="Edit Jadwal Latihan"
          data={editJadwal}
          setData={setEditJadwal}
          onClose={() => setShowEditModal(false)}
          onSave={saveEdit}
        />
      )}
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
function ModalJadwal({ title, data, setData, onClose, onSave }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">
          {title}
        </h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama Kegiatan"
            className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
            value={data.kegiatan}
            onChange={(e) => setData({ ...data, kegiatan: e.target.value })}
          />
          <input
            type="date"
            className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
            value={data.tanggal}
            onChange={(e) => setData({ ...data, tanggal: e.target.value })}
          />
          <input
            type="time"
            className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
            value={data.waktu}
            onChange={(e) => setData({ ...data, waktu: e.target.value })}
          />
          <input
            type="text"
            placeholder="Lokasi"
            className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
            value={data.lokasi}
            onChange={(e) => setData({ ...data, lokasi: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="cursor-pointer px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
