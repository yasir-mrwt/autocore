import React, { useState } from "react";

import Avatar from "/assets/image/Avatar.png";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Badge } from "@mui/material";
import { Bell } from "lucide-react";

const Header = ({ heading }) => {
  const navigate = useNavigate();
  const { user, unreadChat } = useSelector((state) => state.app);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl lg:text-[28px] font-medium text-[#2B3674] capitalize">
          Welcome Back, {user?.user_name}
        </h1>
      </div>
      <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-full shadow-lg">
        <Link to={"/dealer/bargains"}>
          {" "}
          <Badge badgeContent={unreadChat?.length} color="secondary">
            <Bell size={26} onClick={() => navigate("/dealer/bargains")} />
          </Badge>
        </Link>
        <p>
          <img src={Avatar} alt="Avatar" className=" object-cover" />
        </p>
      </div>
    </div>
  );
};

export default Header;
