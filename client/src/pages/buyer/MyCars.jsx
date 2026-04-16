import { useSelector } from "react-redux";
import Card from "../../components/Card";
import { useEffect, useState } from "react";

const MyCars = () => {
  const { allCars, user } = useSelector((state) => state.app);
  const [myCars, setMyCars] = useState([]);

  useEffect(() => {
    let cars = [];
    allCars?.map((car) => {
      if (car.sold && user?._id == car?.buyer_id) cars.push(car);
    });

    setMyCars(cars);
  }, [allCars]);

  return (
    <div className="relative">
      <div className=" container px-2 pb-4">
        <h1 className=" md:text-[38px] text-2xl md:ml-0 font-medium text-black mb-4">
          My Parts
        </h1>
        <div className="grid md:grid-cols-4 gap-7 px-1">
          {myCars?.length != 0 ? (
            myCars?.map((car) => <Card key={car._id} car={car} buy={false} />)
          ) : (
            <div className="h-[50vh] w-screen flex text-2xl items-center justify-center">
              No Parts Yet!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCars;
