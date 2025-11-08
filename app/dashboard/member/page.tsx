"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  getDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Member {
  id: string;
  name: string;
  email: string;
  sport: string;
  status: string;
  jabatan: string;
}

export default function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    sport: "",
    jabatan: "",
  });
  const [editMember, setEditMember] = useState<Member | null>(null);
  const router = useRouter();
    useEffect(() => {
    document.title = "Member - Basavo";
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUserId(u.uid);
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "user");
        } else {
          setRole("user");
        }
      } else {
        setUserId(null);
        setRole(null);
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "members"), orderBy("name", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Member[];
      setMembers(data);
    } catch (error) {
      console.error("❌ Gagal memuat data anggota:", error);
    } finally {
      setLoading(false);
    }
  };
   
  useEffect(() => {
    fetchData();
  }, []);

  const addMember = async () => {
    if (role !== "admin") {
      Swal.fire("Akses Ditolak", "Hanya admin yang bisa menambah anggota.", "error");
      return;
    }

    if (!newMember.name || !newMember.email || !newMember.sport || !newMember.jabatan) {
      Swal.fire("Error", "Semua field wajib diisi!", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "members"), {
        name: newMember.name,
        email: newMember.email,
        sport: newMember.sport,
        status: "belum resmi",
        jabatan: newMember.jabatan,
      });
      setShowModal(false);
      setNewMember({ name: "", email: "", sport: "", jabatan: "" });
      fetchData();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Berhasil menambahkan ${newMember.name}!`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      Swal.fire("Gagal", "Tidak dapat menambahkan anggota.", "error");
    }
  };

  const handleEdit = (member: Member) => {
    setEditMember(member);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editMember) return;

    if (!editMember.name || !editMember.email || !editMember.sport || !editMember.jabatan) {
      Swal.fire("Error", "Semua field wajib diisi!", "warning");
      return;
    }

    try {
      const ref = doc(db, "members", editMember.id);
      await updateDoc(ref, {
        name: editMember.name,
        email: editMember.email,
        sport: editMember.sport,
        jabatan: editMember.jabatan,
      });
      setShowEditModal(false);
      setEditMember(null);
      fetchData();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Data anggota berhasil diperbarui!",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire("Error", "Gagal memperbarui anggota.", "error");
    }
  };

  const del = async (id: string) => {
    if (role !== "admin") return;
    const confirm = await Swal.fire({
      title: "Hapus Anggota?",
      text: "Data ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "members", id));
      fetchData();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Anggota telah dihapus.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Gagal menghapus anggota.", "error");
    }
  };

  const setResmi = async (id: string, name: string) => {
    if (role !== "admin") return;
    const confirm = await Swal.fire({
      title: "Konfirmasi",
      text: `Apakah kamu yakin ingin menjadikan ${name} sebagai anggota resmi?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Set Resmi",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    try {
      await updateDoc(doc(db, "members", id), { status: "resmi" });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `${name} telah menjadi anggota resmi.`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      fetchData();
    } catch {
      Swal.fire("Gagal", "Terjadi kesalahan saat memperbarui status.", "error");
    }
  };
  const maskEmail = (email: string) => {
    const [user, domain] = email.split("@");
    const maskedUser =
      user.length <= 2
        ? user[0] + "*"
        : user.slice(0, 2) + "*".repeat(user.length - 2);
    return `${maskedUser}@${domain}`;
  };

  // 🔹 UI Loading
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="relative w-16 h-16">
          <div className="absolute w-full h-full rounded-full border-4 border-blue-200"></div>
          <div className="absolute w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-700 text-lg font-medium">
          Memuat halaman anggota...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl p-8 rounded-3xl border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
          {role === "admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="cursor-pointer mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg shadow transition-all"
            >
              + Tambah Anggota
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Belum ada data anggota.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{m.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {role === "admin" ? m.email : maskEmail(m.email)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  🏅 Cabang Olahraga:
                  <span className="font-medium text-gray-800 ml-1">{m.sport}</span>
                </p>
                <span className="bg-blue-100 text-gray-500 px-4 py-1 inline-block rounded-full text-xs font-semibold mr-2">
                  {m.jabatan}
                </span>
                <span
                  className={`px-3 py-1 inline-block rounded-full text-xs font-semibold ${
                    m.status === "resmi"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {m.status === "resmi" ? "Anggota Resmi" : "Belum Resmi"}
                </span>

                {role === "admin" && (
                  <div className="mt-4 flex justify-between gap-2">
                    {m.status !== "resmi" && (
                      <button
                        onClick={() => setResmi(m.id, m.name)}
                        className="text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Set Resmi
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(m)}
                      className="cursor-pointer text-xs flex-1 bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200 py-2 rounded-lg transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(m.id)}
                      className="cursor-pointer text-xs flex-1 bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 py-2 rounded-lg transition-all"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <MemberModal
          title="Tambah Anggota Baru"
          data={newMember}
          setData={setNewMember}
          onClose={() => setShowModal(false)}
          onSave={addMember}
        />
      )}

      {showEditModal && editMember && (
        <MemberModal
          title="Edit Data Anggota"
          data={editMember}
          setData={setEditMember}
          onClose={() => setShowEditModal(false)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

function MemberModal({ title, data, setData, onClose, onSave }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">{title}</h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama Lengkap"
            className="text-gray-600 w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 focus:border-blue-500 outline-none"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="text-gray-600 w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 focus:border-blue-500 outline-none"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Cabang Olahraga"
            className="text-gray-600 w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 focus:border-blue-500 outline-none"
            value={data.sport}
            onChange={(e) => setData({ ...data, sport: e.target.value })}
          />
          <select
            className="text-gray-600 w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 focus:border-blue-500 outline-none cursor-pointer"
            value={data.jabatan}
            onChange={(e) => setData({ ...data, jabatan: e.target.value })}
          >
            <option value="">Pilih Jabatan</option>
            <option value="Ketua">Ketua</option>
            <option value="Sekretaris">Sekretaris</option>
            <option value="Bendahara">Bendahara</option>
            <option value="Humas">Humas</option>
            <option value="Peralatan">Peralatan</option>
            <option value="Anggota">Anggota</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-lg border-b-2 border-red-300 text-black hover:bg-gray-100 text-sm transition-transform ease-in-out duration-75"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="cursor-pointer px-4 py-2 rounded-lg border-b-2 border-blue-300 text-black hover:bg-gray-100 text-sm transition ease-in-out duration-75"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
