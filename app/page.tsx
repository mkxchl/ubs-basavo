"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useScrollAnimation } from "./hooks/useScrollAnimation";
import { db } from "@/lib/firebase";
import Swal from "sweetalert2";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { BadgeCheck, Menu, X, MapPin, Send } from "lucide-react";

export default function Home() {
  interface Member {
    id: string;
    name: string;
    email?: string;
    sport?: string;
    status?: string;
    jabatan?: string;
    img?: string;
  }
  interface Jadwal {
    id: string;
    hari: string;
    waktu: string;
    kegiatan: string;
    tanggal: string;
    lokasi: string;
    dibuatOleh: string;
    dibuatPada: string;
  }
  const [form, setForm] = useState({ nama: "", email: "", nim: "", pesan: "", prodi: "" });
  const [success, setSuccess] = useState(false);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [totalJadwal, setTotalJadwal] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const sections = [
    { id: "home", label: "Beranda" },
    { id: "about", label: "Tentang" },
    { id: "activities", label: "Kegiatan" },
    { id: "gallery", label: "Galeri" },
    { id: "team", label: "Tim" },
    { id: "contact", label: "Kontak" },
  ];

  const fetchJadwal = async () => {
    try {
      setLoadingJadwal(true);
      const q = query(collection(db, "jadwal"), orderBy("hari", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Jadwal[];
      setJadwal(data);
    } catch (err) {
      console.error("❌ Gagal mengambil data jadwal:", err);
    } finally {
      setLoadingJadwal(false);
    }
  };
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
    fetchJadwal();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "members"), orderBy("name", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Member[];
      setTeam(data);
    } catch (error) {
      console.error("❌ Gagal memuat data anggota:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await addDoc(collection(db, "faq"), {
      ...form,
      waktu: serverTimestamp(),
    });

    Swal.fire({
      title: "Berhasil!",
      text: "Pesan kamu telah dikirim.",
      icon: "success",
      confirmButtonColor: "#6366f1", 
      confirmButtonText: "OK",
      timer: 3000,
      timerProgressBar: true,
    });

    setForm({ nama: "", email: "", nim: "", pesan: "", prodi: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  } catch (err) {
    console.error("❌ Gagal mengirim pesan:", err);

    Swal.fire({
      title: "Gagal!",
      text: "Terjadi kesalahan saat mengirim pesan. Coba lagi nanti.",
      icon: "error",
      confirmButtonColor: "#ef4444", // merah Tailwind
      confirmButtonText: "Tutup",
    });
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    document.title = "Basavo";
  }, []);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll animation hooks
  const aboutAnim = useScrollAnimation();
  const activitiesAnim = useScrollAnimation();
  const galleryAnim = useScrollAnimation();
  const teamAnim = useScrollAnimation();
  const contactAnim = useScrollAnimation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-md"
            : "bg-transparent backdrop-blur-none"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <img
            src="/img/logo.jpg"
            alt="Basavo Logo"
            className="h-10 w-10 object-contain rounded-full shadow-md md:hidden"
          ></img>
          <h1
            className={`text-2xl font-extrabold tracking-wide transition-colors duration-300 ${
              scrolled ? "text-blue-700" : "text-blue-700 drop-shadow-md"
            }`}
          >
            Basavo
          </h1>

          <ul className="hidden md:flex space-x-6 font-medium">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`transition-colors duration-300 ${
                    scrolled
                      ? "text-blue-700 hover:text-blue-700"
                      : "text-blue-700 hover:text-blue-300"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-blue-700 hover:bg-blue-50 transition-all cursor-pointer"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        <div
          className={`md:hidden bg-white/90 backdrop-blur-md shadow-md transition-all duration-500 overflow-hidden ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="flex flex-col items-center py-4 space-y-4 font-medium">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-blue-700 hover:text-blue-500 transition-colors duration-300"
                  onClick={() => setOpen(false)} // Tutup menu setelah klik
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>
      <section
        id="home"
        className="pt-24 h-[90vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100"
      >
        <div className="text-center p-10 rounded-3xl shadow-xl bg-white/80 backdrop-blur-sm border border-indigo-100 max-w-2xl animate-fade-in">
          <h2 className="text-5xl font-extrabold mb-5 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Selamat Datang di UKM Voli Basavo!
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Tempat para mahasiswa pecinta voli berkumpul, berlatih, dan
            berprestasi bersama. Bergabunglah untuk menjadi bagian dari tim yang
            solid dan penuh semangat!
          </p>
          <a
            href="#about"
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300"
          >
            Pelajari Lebih Lanjut
          </a>
        </div>
      </section>

      <motion.section
        id="about"
        ref={aboutAnim.ref}
        animate={aboutAnim.controls}
        initial="hidden"
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className="py-20 text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
      >
        <h3 className="text-3xl font-bold mb-6">Tentang Kami</h3>
        <p className="text-lg leading-relaxed max-w-3xl mx-auto">
          UKM Voli Kampus berdiri sejak tahun 2015 sebagai wadah bagi mahasiswa
          yang memiliki minat di bidang olahraga bola voli. Kami rutin
          mengadakan latihan, turnamen internal, serta mengikuti kompetisi antar
          universitas.
        </p>
      </motion.section>
      <motion.section
        id="activities"
        ref={activitiesAnim.ref}
        animate={activitiesAnim.controls}
        initial="hidden"
        variants={{
          hidden: { opacity: 0, y: 70 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className="py-20 bg-gradient-to-br from-indigo-50 via-white to-indigo-100"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-10 text-purple-600">
            Jadwal Kami
          </h3>

          {loadingJadwal ? (
            <p className="text-gray-500 italic">Memuat jadwal kegiatan...</p>
          ) : jadwal.length === 0 ? (
            <p className="text-gray-500 italic">Belum ada jadwal kegiatan.</p>
          ) : (
            <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-8">
              {jadwal.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.08)]
              hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1
              transition-all duration-300 ease-in-out text-left"
                >
                  <img
                    src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=60"
                    alt=""
                    className="rounded-xl mb-5"
                  />
                  <p className="font-semibold text-lg text-gray-800 mb-1">
                    {item.kegiatan}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    • {item.waktu}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {item.lokasi}
                  </p>
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                    Dibuat oleh: {item.dibuatOleh}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <motion.section
        id="gallery"
        ref={galleryAnim.ref}
        animate={galleryAnim.controls}
        initial="hidden"
        variants={{
          hidden: { opacity: 0, y: 70 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-10 text-white">
            Galeri Kegiatan
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {["/img/K1.jpg", "/img/K2.jpg"].map((path, i) => (
              <img
                key={i}
                src={path}
                alt="Foto Kegiatan"
                className="cursor-pointer rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-transform h-56 w-full object-cover"
              />
            ))}
          </div>
        </div>
      </motion.section>
      <section id="team" className="py-20 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-10 text-purple-500">Tim Kami</h3>
          {loading ? (
            <p>Memuat data tim...</p>
          ) : (
            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-8"
                ref={teamAnim.ref}
                animate={{ x: ["0%", "-500%"] }}
                transition={{
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  duration: 30,
                }}
              >
                {[...team, ...team].map((m, i) => (
                  <div
                    key={i}
                    className="min-w-[220px] bg-white p-6 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] 
        hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1 
        transition-all duration-300 ease-in-out text-center"
                  >
                    <img
                      src={
                        m.img ||
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                      }
                      alt={m.name}
                      className="w-24 h-24 mx-auto rounded-full mb-4 mt-4 shadow-md object-cover"
                    />

                    <div className="flex items-center justify-center gap-2">
                      <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                        {m.name}
                        {m.name?.toLowerCase() === "marchelino" && (
                          <BadgeCheck className="w-5 h-5" />
                        )}
                      </h4>
                    </div>
                    <p className="text-gray-500 text-sm">{m.jabatan}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </section>
      <motion.section
        id="contact"
        ref={contactAnim.ref}
        animate={contactAnim.controls}
        initial="hidden"
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6 text-white">Kontak Kami</h3>
          <p className="mb-8 text-gray-200">
            Tertarik bergabung? Hubungi kami melalui email atau media sosial!
          </p>
          <motion.section
      id="contact"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="py-20 bg-gradient-to-br from-indigo-50 via-white to-indigo-100"
    >
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.08)] 
                     rounded-2xl p-8 border border-gray-100"
          whileHover={{ scale: 1.01 }}
        >
          <div className="grid gap-5">
            <div>
              <label className="block text-left font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                required
                placeholder="Masukkan nama kamu"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-left font-medium text-gray-700 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Masukkan email kamu"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-left font-medium text-gray-700 mb-1">
                Nim
              </label>
              <input
                type="text"
                name="nim"
                value={form.nim}
                onChange={handleChange}
                required
                placeholder="Masukkan nim kamu"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-left font-medium text-gray-700 mb-1">
                Prodi
              </label>
              <input
                type="text"
                name="prodi"
                value={form.prodi}
                onChange={handleChange}
                required
                placeholder="Nama Prodi"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-left font-medium text-gray-700 mb-1">
                Pesan
              </label>
              <textarea
                name="pesan"
                value={form.pesan}
                onChange={handleChange}
                required
                placeholder="Tulis pesan kamu di sini..."
                className="w-full p-3 rounded-lg border border-gray-200 h-32 resize-none focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r 
                         from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
                         text-white font-semibold px-6 py-3 rounded-lg shadow-lg w-full 
                         transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Mengirim..." : "Kirim Pesan"}
              {!loading && <Send className="w-4 h-4" />}
            </motion.button>
          </div>

          {success && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-600 mt-4 text-center font-medium"
            >
              ✅ Pesan berhasil dikirim!
            </motion.p>
          )}
        </motion.form>
      </div>
    </motion.section>
        </div>
      </motion.section>
      <footer className="bg-gray-900 text-white text-center py-6">
        <p>© 2025 UKM Basavo. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
