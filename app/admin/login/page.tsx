"use client";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          name: user.displayName || "Tanpa Nama",
          email: user.email,
          photoURL: user.photoURL || "",
          role: "user",
          joinAt: new Date(),
        });
        console.log("✅ Data user baru disimpan ke Firestore");
      } else {
        console.log("User sudah ada di Firestore");
      }

      alert("✅ Login berhasil!");
      router.push("/admin");
    } catch (error: any) {
      console.error("❌ Gagal login:", error);
      alert("❌ Gagal login: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login Admin UKM Olahraga
        </h1>

        {/* Tombol Login Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg w-full hover:bg-gray-100 transition"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
}
