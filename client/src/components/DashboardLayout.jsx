import { useState, useEffect } from "react";
import { Car, History, LogOut, UsersRound } from "lucide-react";
import { menuItems } from "../../constants";
import Logo from "../components/Logo";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { asyncLogOut } from "../store/actions/appActions";
import { useDispatch } from "react-redux";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../utils/Toast";

const DashboardLayout = ({ children }) => {
  const [active, setActive] = useState("deal-history");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { pathname } = useLocation();

  useEffect(() => {
    pathname.includes("deal-history") && setActive("deal-history");
    pathname.includes("bargains") && setActive("bargains");
    pathname.includes("my-cars") && setActive("my-cars");
  }, [pathname]);

  return (
    <div className="w-full min-h-screen bg-gray-50 px-10">
      <div className="container py-7 h-full">
        <div className="flex items-start justify-between">
          <div className="w-[20%] bg-white h-[95vh] rounded-2xl pt-6 flex flex-col justify-between shadow-xl">
            <div className=" h-full">
              <div className=" flex items-center gap-3 ml-5">
                <Logo />

                <h1 className="text-sm lg:text-base text-[#1572D3] font-semibold">
                  AutoCore
                </h1>
              </div>
              <div className="w-full h-[1px] bg-[#F4F7FE] my-5"></div>
              <div className="w-full flex flex-col justify-between">
                <div>
                  {menuItems.map((e, index) => {
                    return (
                      <div key={index} className="pr-3 mb-2 flex-1">
                        <Link
                          to={{ pathname: e.path }}
                          onClick={() => setActive(e.path)}
                          className={`${
                            e.path === active ? "bg-[#E1E9FC]" : " "
                          } flex items-center justify-between rounded-r-[10px] cursor-pointer h-full hover:bg-[#E1E9FC60] pl-3`}
                        >
                          <div className="flex items-center py-2.5 pl-3">
                            {e.path == "deal-history" ? (
                              <History />
                            ) : e.path == "bargains" ? (
                              <UsersRound />
                            ) : (
                              <Car />
                            )}

                            <span
                              className={`ml-2 text-sm lg:text-base font-medium  ${
                                e.path === navigate.asPath
                                  ? "text-[#2B3674]"
                                  : "text-[#323232]"
                              }`}
                            >
                              {e.name}
                            </span>
                          </div>
                          <div
                            className={`w-[4px] h-12 rounded-3xl text-white ${
                              e.path === navigate.asPath ? "bg-[#336AEA]" : " "
                            } `}
                          ></div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LOGOUT */}
            <div
              className="pl-3 mb-2 cursor-pointer text-red-500 hover:bg-[#E1E9FC60]"
              onClick={() => {
                const id = notifyPendingPromise("Logging out...");
                const res = dispatch(asyncLogOut());
                if (res == 200)
                  notifySuccessPromise(id, "Logged out successfully!");
                else notifyErrorPromise(id, "Error logging out!");
              }}
            >
              <div className="flex items-center py-2.5 pl-3">
                <LogOut />
                <span className={`ml-2 text-base font-medium text-[#323232]" `}>
                  Logout
                </span>
              </div>
            </div>
          </div>

          <div className="w-[80%] flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
