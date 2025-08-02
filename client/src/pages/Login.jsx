import React from "react";

const Login = () => {
  const handleLogin = () => {
    // Redirect to the backend GitHub auth route
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#1f1c2c] to-[#11172a] text-slate-200 font-light">
      <div className="w-full max-w-md p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg shadow-primary/10">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-orbitron text-primary tracking-widest">
            Hack-Collab ⌁
          </h1>
          <p className="text-sm text-slate-400">
            Authenticate with GitHub to begin your mission.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 font-semibold text-sm bg-primary/80 hover:bg-primary text-black rounded-lg tracking-wider uppercase transition-all"
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
