import { useSelector } from "react-redux";
import Card from "../../components/Card";

const WatchList = () => {
  const { allCars, watchList } = useSelector((state) => state.app);

  return (
    <div className="relative">
      <div className=" container px-2 pb-4">
        {/* <h1 className=" text-[38px] font-medium text-black text-center">
        Most popular cars cars
      </h1> */}

        <h1 className=" md:text-[38px] text-2xl md:ml-0 font-medium text-black mb-4">
          WatchList
        </h1>
        <div className="">
          {watchList.length ? (
            <div className="grid md:grid-cols-4 gap-7">
              {allCars?.map((car, index) => {
                if (watchList.includes(car._id))
                  return <Card key={index} car={car} />;
              })}
            </div>
          ) : (
            <div className="h-[50vh] w-full  flex justify-center items-center text-2xl">
              No Cars in your WatchList!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchList;