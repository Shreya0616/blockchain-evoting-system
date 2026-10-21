import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

export default function AdminRoute({ component: Page, ...rest }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  if (user === undefined) {
    return <p>Checking login...</p>;
  }

  if (!user) {
    return <Redirect to="/AdminLogin" />;
  }

  if (user.email?.toLowerCase() !== "shreyadthota@gmail.com") {
    return <Redirect to="/" />;
  }

  return <Page {...rest} />;
}