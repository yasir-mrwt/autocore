import Avatar from "/assets/image/Avatar.png";
import { useSelector } from "react-redux";

const Header = () => {
  const user = useSelector((state) => state.app.admin?.user);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl lg:text-[28px] font-medium text-[#2B3674] capitalize">
          Welcome Back, {user?.user_name || user?.name || "Admin"}
        </h1>
      </div>
      <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-full shadow-lg">
        <span className="text-sm font-semibold text-[#1572D3]">Admin</span>
        <p>
          <img src={Avatar} alt="Avatar" className=" object-cover" />
        </p>
      </div>
    </div>
  );
};

export default Header;
