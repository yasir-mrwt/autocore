import { Navigate, Route, Routes } from "react-router-dom";
import Header from "../../components/Header";
import Bargains from "../../pages/dealer/Bargains";
import DealHistory from "../../pages/dealer/DealHistory";
import MyCars from "../../pages/dealer/MyCars";
import DashboardLayout from "../../components/DashboardLayout";

import AddCar from "./AddCar";
import EditCar from "./EditCar";
import CarDetail from "./CarDetailDealer";
import { useMediaQuery } from "@mui/material";
import { useDispatch } from "react-redux";
import { asyncLogOut } from "../../store/actions/appActions";

const Dealer = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(min-width:768px)");

  return (
    <>
      {!isMobile ? (
        <div className="absolute top-0 flex-col left-0 h-screen text-center px-2 w-screen z-[100] bg-white flex justify-center items-center">
          <p>Dealer Screen is better on screens &gt; 768px</p>
          <button onClick={() => dispatch(asyncLogOut())} className="mt-5 bg-red-300 px-4 py-1 rounded-md">LogOut</button>
        </div>
      ) : (
        <DashboardLayout>
          <div className="flex-1 ml-6">
            <Header />
            {/* <span
          className="flex text-red-500 cursor-pointer gap-2"
          onClick={() => dispatch(asyncLogOut())}
        >
          <LogOut /> Log out
        </span> */}
            <Routes>
              <Route
                index
                path="/"
                element={<Navigate to="deal-history" replace />}
              />
              <Route path="/deal-history" element={<DealHistory />} />
              <Route path="/bargains" element={<Bargains />} />
              <Route path="/my-cars" element={<MyCars />} />
              <Route path="/add-car" element={<AddCar />} />
              <Route path="/edit-car" element={<EditCar />} />
              <Route path="/car-detail" element={<CarDetail />} />
            </Routes>
          </div>
        </DashboardLayout>
      )}
    </>
  );
};

export default Dealer;
