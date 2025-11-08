"use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trash2, Mail, User, MessageCircle, ArrowLeft } from "lucide-react";

export default function AdminKontakPage() {
  const [pesan, setPesan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  interface Faq {
    nama: string;
    email?: string;
    pesan: string;
    waktu?: any;
    nim?: string;
  }

  // 🔹 Ambil data dari Firestore
  const fetchPesan = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "faq")); // ubah jika koleksi bukan "faq"
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPesan(data);
    } catch (err) {
      console.error("❌ Gagal mengambil pesan:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Hapus pesan berdasarkan ID
  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus pesan ini?")) {
      await deleteDoc(doc(db, "faq", id));
      fetchPesan();
    }
  };

  useEffect(() => {
    fetchPesan();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 py-16 px-6"
    >
      <div className="max-w-5xl mx-auto bg-white shadow-2xl p-8 rounded-3xl border border-gray-200">
        {/* 🔹 Tombol kembali */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
        </div>

        {/* 🔹 Daftar pesan */}
        {loading ? (
          <p className="text-center text-gray-500 italic animate-pulse">
            Memuat pesan...
          </p>
        ) : pesan.length === 0 ? (
          <p className="text-center text-gray-600">Belum ada pesan masuk.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pesan.map((item: Faq & { id: string }) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 transition-all duration-300"
              >
                <div className="flex items-center mb-3">
                  <User className="w-4 h-4 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">
                    {item.nama || "Tanpa Nama"}
                  </h3>
                </div>

                <div className="flex items-center mb-3">
                  <Mail className="w-4 h-4 text-blue-600 mr-2" />
                  <p className="text-gray-600 text-sm">
                    {item.email || "Tidak ada email"}
                  </p>
                </div>

                <div className="flex items-start mb-4">
                  <MessageCircle className="w-4 h-4 text-green-600 mr-2 mt-1" />
                  <p className="text-gray-700 leading-relaxed">{item.pesan}</p>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="cursor-pointer flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Hapus Pesan
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
