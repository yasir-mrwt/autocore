import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { notifyInfo } from "../utils/Toast";

const IsAuthenticated = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.app);
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated && isMounted) {
      notifyInfo("Login to access page!");
      navigate("/sign-in");
    }
  }, [isAuthenticated, isMounted]);

  return <>{children}</>;
};

export default IsAuthenticated;
