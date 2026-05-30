import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
 

const Signup = () => {
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signup(username, email, password);
      window.location.href = "/";
    } catch (err) {
      alert(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f8f7ff_0%,#eef2ff_40%,#fdf2f8_100%)]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="px-4 md:px-12 transition-opacity duration-600 ease-out">
            <div className="max-w-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg">MB</div>
                <h1 className="text-2xl md:text-3xl font-extrabold">MindBridge</h1>
              </div>

              <h2 className="mt-8 text-3xl md:text-4xl font-extrabold">Welcome to MindBridge <span className="text-2xl">🌿</span></h2>
              <p className="mt-4 text-slate-600">Your safe space to reflect, connect, and grow together.</p>

              <ul className="mt-6 space-y-3 text-slate-700">
                <li className="flex items-start space-x-3">
                  <div className="text-2xl">📖</div>
                  <div>
                    <div className="font-semibold">Journal & Reflect</div>
                    <div className="text-sm text-slate-500">Write your thoughts and understand yourself better.</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="text-2xl">💜</div>
                  <div>
                    <div className="font-semibold">Track Your Mood</div>
                    <div className="text-sm text-slate-500">Monitor emotions and celebrate small wins.</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="text-2xl">👥</div>
                  <div>
                    <div className="font-semibold">Supportive Communities</div>
                    <div className="text-sm text-slate-500">Connect with circles that uplift and inspire.</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <div className="font-semibold">Privacy First</div>
                    <div className="text-sm text-slate-500">Your thoughts are safe with us.</div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 p-4 rounded-lg bg-white/60 backdrop-blur-md border border-white/40">
                <div className="text-sm text-slate-700 italic">"Small steps every day lead to big changes."</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center transition-transform duration-500 ease-out">
            <div className="glass-card w-full max-w-md p-8">
              <h3 className="text-2xl font-extrabold text-slate-800">Create Account</h3>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <input placeholder="Username" required onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full h-14 rounded-xl border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input type="email" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full h-14 rounded-xl border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input type="password" placeholder="Password" required onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full h-14 rounded-xl border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <button disabled={loading} className="w-full h-14 rounded-xl text-white font-semibold bg-gradient-to-br from-primary to-secondary hover:scale-[1.01] transition transform shadow-lg">{loading ? "Creating..." : "Sign up"}</button>
              </form>

              <div className="mt-4 text-center text-slate-600">Already have an account? <Link className="text-primary font-semibold" to="/login">Login</Link></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
