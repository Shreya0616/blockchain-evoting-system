import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "../../firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const credential = await signInWithEmailAndPassword(
  auth,
  email.trim(),
  password
);


setMessage("Login successful! Redirecting...");
window.location.href = "/ElectionSetup";

    } catch (error) {
      console.error("Firebase login error:", error.code, error.message);
      setMessage(
        "Login failed: " + (error.code || error.message)
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessage("Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("Logout failed.");
    }
  };

  return (
    <div className="container-main">
      <div className="container-item">
        <h2>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <p>Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <p>Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <br /><br />
          <button type="submit">Login</button>
        </form>

        <br />
        <button type="button" onClick={handleLogout}>
          Logout
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
