import { useEffect } from "react";
import LoginForm from "@/components/auth/LoginForm";

const Auth = () => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("auth-route");
    body.classList.add("auth-route");
    return () => {
      html.classList.remove("auth-route");
      body.classList.remove("auth-route");
    };
  }, []);

  return <LoginForm />;
};

export default Auth;

