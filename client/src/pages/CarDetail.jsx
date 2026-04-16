import React from "react";
import { ChevronLeft, ChevronRight, Heart, Share } from "lucide-react";
import Car_img from "/assets/image/car_img1.png";
import User_icon from "/assets/icon/user_icon.svg";
import Type_icon from "/assets/icon/type_icon.svg";
import Conditioner_icon from "/assets/icon/conditioner_icon.svg";
import Door_icon from "/assets/icon/door_icon.svg";
import Card from "../components/Card";

const CarDetail = () => {
  return (
    <div className=" container">
      <div className="overflow-hidden mt-8">
        <div className="mb-9">
          <div className=" grid grid-cols-2 items-start gap-2">
            <div className="items-center justify-center h-full overflow-hidden md:mb-8 lg:mb-0 xl:flex">
              <div className="w-full gap-2 xl:flex xl:flex-row-reverse">
                <div className=" relative">
                  <div className="relative flex items-center justify-center">
                    <img
                      alt="Product gallery 1"
                      src="https://images.unsplash.com/photo-1580902394724-b08ff9ba7e8a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1548&q=80"
                      width={650}
                      height={590}
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div className="absolute top-2/4 z-10 flex w-full items-center justify-between">
                    <ChevronLeft className="text-white" />
                    <ChevronRight className="text-white" />
                  </div>
                </div>
                <div className=" flex flex-col gap-4">
                  {[
                    "https://images.unsplash.com/photo-1580902394836-21e0d429b7f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=924&q=80",
                    "https://images.unsplash.com/photo-1580902394743-1394a7ec93d2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
                    "https://images.unsplash.com/photo-1580902394767-81b0facc0894?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1yZWxhdGVkfDN8fHxlbnwwfHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
                  ].map((image, index) => (
                    <div
                      key={image}
                      className="border-border-base flex cursor-pointer items-center justify-center overflow-hidden rounded border transition hover:opacity-75 "
                    >
                      <img
                        alt={`Product ${index}`}
                        src={image}
                        decoding="async"
                        loading="lazy"
                        className=" h-full w-28 object-cover aspect-square rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col bg-white h-full rounded-xl px-6 pr-10">
              <div className="flex items-start justify-between ">
                <div className="pb-3">
                  <h2 className="text-[32px] font-semibold">Nissan GT - R</h2>
                  <p className="mt-1 text-sm font-normal">
                    ⭐⭐⭐⭐⭐{" "}
                    <span className=" text-[#596780]">440+ Reviewer</span>
                  </p>
                </div>
                <div className="p-2 bg-white shadow-md cursor-pointer rounded-full">
                  <Heart fill="#ED3F3F" className=" text-[#ED3F3F]" />
                </div>
              </div>
              <p className=" text-base text-[#596780] font-normal w-[70%] leading-7">
                NISMO has become the embodiment of Nissan's outstanding
                performance, inspired by the most unforgiving proving ground,
                the "race track".
              </p>
              <div className=" grid grid-cols-2 w-1/2 gap-x-10 pb-2 mt-2">
                {[
                  {
                    icon: User_icon,
                    content: "4 Passagers",
                  },
                  {
                    icon: Type_icon,
                    content: "Auto",
                  },
                  {
                    icon: Conditioner_icon,
                    content: "Air Conditioning",
                  },
                  {
                    icon: Door_icon,
                    content: "4 Doors",
                  },
                ].map((info, index) => (
                  <div key={index} className="flex items-center gap-2 mt-3">
                    <img src={info.icon} alt="" />
                    {/* <span className=" text-sm font-normal text-[#959595] text-nowrap">
                      {info.title}
                    </span> */}
                    <span className=" text-sm font-normal text-[#959595] text-nowrap">
                      {info.content}
                    </span>
                  </div>
                ))}
              </div>
              <div className=" flex items-center justify-between">
                <div className="  mt-2 flex flex-col">
                  <span className=" text-[22px] font-semibold">₹ 5,00,000</span>
                  <span className=" text-[14px] font-semibold line-through text-[#90A3BF]">
                    ₹ 5,50,000
                  </span>
                </div>

                <button className="bg-[#1572D3] w-fit px-10 py-2 text-white rounded-lg mt-3">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=" container mt-20">
        <div className=" flex items-center justify-between">
          <h1 className=" text-xl font-medium text-black">Recent Car</h1>
          <h1 className=" text-base font-medium text-[#3563E9] hover:underline">
            View All
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-7 mt-4">
          {[0, 1, 2, 3].map((e, index) => (
            <Card key={index} />
          ))}
        </div>
      </div>

      <div className=" container mt-20 mb-20">
        <div className=" flex items-center justify-between">
          <h1 className=" text-xl font-medium text-black">Recomendation Car</h1>
          <h1 className=" text-base font-medium text-[#3563E9] hover:underline">
            View All
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-7 mt-4">
          {[0, 1, 2, 3].map((e, index) => (
            <Card key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarDetail;
