"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import LoadingPage from "../../component/Loading";
import { Trash } from "lucide-react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

interface KasItem {
  id: string;
  jenis: "pemasukan" | "pengeluaran";
  keterangan: string;
  jumlah: number;
  tanggal: string;
  dibuatOleh: string;
}

export default function DataKasPage() {
  const router = useRouter();
  const [kasList, setKasList] = useState<KasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKas, setNewKas] = useState({
    jenis: "pemasukan",
    keterangan: "",
    jumlah: "",
    tanggal: "",
  });
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // ✅ Diperbaiki

  // 🔹 Ambil role user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role);

          // 🔒 Batasi hanya admin
          if (userData.role !== "admin") {
            Swal.fire({
              icon: "error",
              title: "Akses Ditolak 🚫",
              text: "Hanya admin yang bisa mengakses halaman Kas.",
              confirmButtonText: "Kembali",
            }).then(() => {
              router.push("/dashboard");
            });
          }
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Gagal memuat data user:", err);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "kas"), orderBy("tanggal", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as KasItem[];
      setKasList(data);
    });
    return () => unsub();
  }, []);

  const handleTambahKas = async () => {
    if (!newKas.keterangan || !newKas.jumlah || !newKas.tanggal) {
      Swal.fire("Error", "Semua field wajib diisi.", "error");
      return;
    }

    try {
      await addDoc(collection(db, "kas"), {
        ...newKas,
        jumlah: parseFloat(newKas.jumlah),
        dibuatOleh: user?.email,
        dibuatPada: new Date(),
      });
      setShowModal(false);
      setNewKas({
        jenis: "pemasukan",
        keterangan: "",
        jumlah: "",
        tanggal: "",
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Kas berhasil di tambahkan`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire("Error", "Gagal menambah data kas.", "error");
      console.error(err);
    }
  };

  const handleDeleteKas = async (id: string) => {
    if (role !== "admin") {
      Swal.fire(
        "Akses Ditolak",
        "Hanya admin yang bisa menghapus data.",
        "error"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Hapus Data Kas?",
      text: "Data ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "kas", id));
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Data dihapus`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const pemasukan = kasList.filter((i) => i.jenis === "pemasukan");
  const pengeluaran = kasList.filter((i) => i.jenis === "pengeluaran");

  const totalPemasukan = pemasukan.reduce((sum, i) => sum + i.jumlah, 0);
  const totalPengeluaran = pengeluaran.reduce((sum, i) => sum + i.jumlah, 0);
  const totalSaldo = totalPemasukan - totalPengeluaran;

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Data Kas</h2>
          {role === "admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition cursor-pointer"
            >
              + Tambah Data
            </button>
          )}
        </div>
        <div className="mb-5 space-y-2">
          <h3 className="text-lg font-medium text-gray-600">Saldo Total:</h3>
          <p className="text-3xl font-bold text-green-600">
            Rp {totalSaldo.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="mb-10">
          <h3 className="text-xl font-semibold text-green-700 mb-3">
            Pemasukan
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-100 text-gray-700">
                  <th className="px-4 py-2 text-left">Tanggal</th>
                  <th className="px-4 py-2 text-left">Keterangan</th>
                  <th className="px-4 py-2 text-right">Jumlah</th>
                  {role === "admin" && (
                    <th className="px-4 py-2 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pemasukan.map((item) => (
                  <tr
                    key={item.id}
                    className="border-none transition text-black"
                  >
                    <td className="px-4 py-2">{item.tanggal}</td>
                    <td className="px-4 py-2">{item.keterangan}</td>
                    <td className="px-4 py-2 text-right text-black font-semibold">
                      Rp {item.jumlah.toLocaleString("id-ID")}
                    </td>
                    {role === "admin" && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDeleteKas(item.id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer text-xl"
                        >
                          <Trash className="text-xl" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 mb-3">
            Pengeluaran
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-red-100 text-gray-700 text-black">
                  <th className="px-4 py-2 text-left">Tanggal</th>
                  <th className="px-4 py-2 text-left">Keterangan</th>
                  <th className="px-4 py-2 text-right">Jumlah</th>
                  {role === "admin" && (
                    <th className="px-4 py-2 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pengeluaran.map((item) => (
                  <tr
                    key={item.id}
                    className="border-none transition text-black"
                  >
                    <td className="px-4 py-2">{item.tanggal}</td>
                    <td className="px-4 py-2">{item.keterangan}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-semibold">
                      Rp {item.jumlah.toLocaleString("id-ID")}
                    </td>
                    {role === "admin" && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDeleteKas(item.id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          <Trash />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Tambah Data Kas
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 text-2xl cursor-pointer"
              >
                ✖
              </button>
            </div>

            <div className="space-y-4">
              <select
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newKas.jenis}
                onChange={(e) =>
                  setNewKas({ ...newKas, jenis: e.target.value })
                }
              >
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>

              <input
                type="text"
                placeholder="Keterangan"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newKas.keterangan}
                onChange={(e) =>
                  setNewKas({ ...newKas, keterangan: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Jumlah (Rp)"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newKas.jumlah}
                onChange={(e) =>
                  setNewKas({ ...newKas, jumlah: e.target.value })
                }
              />

              <input
                type="date"
                className="w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 text-black focus:border-blue-500 focus:outline-none transition-all"
                value={newKas.tanggal}
                onChange={(e) =>
                  setNewKas({ ...newKas, tanggal: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleTambahKas}
                className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
