import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { notifyInfo } from "../utils/Toast";

const IsAuthenticated = ({ children, requiredUserType = "Buyer" }) => {
  const { roleState, authChecked } = useSelector((state) => ({
    roleState: requiredUserType === "Admin" ? state.app.admin : state.app.customer,
    authChecked: state.app.authChecked,
  }));
  const navigate = useNavigate();

  useEffect(() => {
    if (authChecked && !roleState?.isAuthenticated) {
      notifyInfo("Login to access page!");
      navigate(requiredUserType === "Admin" ? "/admin/login" : "/sign-in", {
        replace: true,
      });
    }
  }, [authChecked, navigate, requiredUserType, roleState?.isAuthenticated]);

  if (!authChecked || !roleState?.isAuthenticated) return null;

  return <>{children}</>;
};

export default IsAuthenticated;
