import { Formik } from "formik";
import Car_img from "/assets/image/car_img1.png";
import InputField from "../../components/formik/InputField";
import * as Yup from "yup";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../../utils/Toast";
import { useNavigate } from "react-router-dom";
import { asyncUpdateCar } from "../../store/actions/carActions";
import { CarCapacity, CarTypes } from "../../../constants";

const EditCar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedCar } = useSelector((state) => state.app);

  const [description, setDescription] = useState(
    selectedCar?.description || ""
  );

  const initialValues = {
    type: selectedCar?.type || "",
    name: selectedCar?.name || "",
    model: selectedCar?.model || "",
    door: selectedCar?.door || "",
    air_conditioner: selectedCar?.air_conditioner ? "True" : "False",
    fuel_capacity: selectedCar?.fuel_capacity || "",
    transmission: selectedCar?.transmission || "",
    capacity:
      selectedCar?.capacity != 8
        ? selectedCar?.capacity + " Person"
        : selectedCar?.capacity + " or More" || "",
    price: selectedCar?.price || "",
  };

  const validationSchema = Yup.object().shape({
    type: Yup.string().required("Type is required"),
    name: Yup.string().required("Name is required"),
    model: Yup.string().required("Model is required"),
    door: Yup.string().required("Door is required"),
    air_conditioner: Yup.string().required("Air conditioner is required"),
    fuel_capacity: Yup.string().required("Fuel capacity is required"),
    transmission: Yup.string().required("Transmission is required"),
    capacity: Yup.string().required("Capacity is required"),
    price: Yup.string().required("Price is required"),
  });

  const [image] = useState({
    main: selectedCar?.image?.main?.url || Car_img,
    secondary: selectedCar?.image?.secondary?.url || Car_img,
    tertiary: selectedCar?.image?.tertiary?.url || Car_img,
  });

  const [newImage, setNewImage] = useState({
    main: null,
    secondary: null,
    tertiary: null,
  });

  const [imageError, setImageError] = useState({
    main: null,
    secondary: null,
    tertiary: null,
  });

  const handleImageChange = (e) => {
    setNewImage((prevState) => {
      const newState = {
        ...prevState,
        [e.target.name]: e.target.files[0],
      };
      return newState;
    });
  };

  const checkImages = () => {
    setImageError({
      main: null,
      secondary: null,
      tertiary: null,
    });

    // Check each field of the image state
    if (!image.main) {
      setImageError((prevState) => ({
        ...prevState,
        main: "Main image is required. Click to upload.",
      }));
      return false;
    }

    if (!image.secondary) {
      setImageError((prevState) => ({
        ...prevState,
        secondary: "Left image is required. Click to upload.",
      }));
      return false;
    }

    if (!image.tertiary) {
      setImageError((prevState) => ({
        ...prevState,
        tertiary: "Right image is required. Click to upload",
      }));
      return false;
    }

    return true;
  };

  const handleSubmit = (val) => {
    if (!checkImages()) return;

    const id = notifyPendingPromise("Updating car...");
    const dataToSend = {
      images: {
        main: newImage.main,
        secondary: newImage.secondary,
        tertiary: newImage.tertiary,
      },

      description: description,
      name: val.name,
      type: val.type,
      model: val.model,
      door: val.door,
      air_conditioner: val.air_conditioner == "True" ? true : false,
      fuel_capacity: val.fuel_capacity,
      transmission: val.transmission,
      price: val.price,
      capacity: Number(val.capacity.split(" ")[0]),
    };

    dispatch(asyncUpdateCar(selectedCar._id, dataToSend)).then((res) => {
      if (res == 200) {
        notifySuccessPromise(id, "Car updated successfully!");
        navigate("/dealer/my-cars");
      } else notifyErrorPromise(id, res.message);
    });
  };

  return (
    <div className=" w-full container py-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold">Edit Car</h2>
          <p className="mt-1 text-sm font-medium text-gray-700"></p>
        </div>
      </div>
      <div className=" bg-white rounded-xl p-7 mt-2">
        <div className=" grid grid-cols-2 gap-10">
          <div className=" flex flex-col  h-full items-center justify-start flex-wrap gap-5 mt-4">
            {/* MAIN IMAGE */}
            <div
              // onClick={() => {
              //   document.getElementById("mainImage").click();
              // }}
              className={`hover:shadow-xl hover:scale-[1.05] transition-all cursor-pointer  text-gray-500 hover:text-gray-700 w-full flex justify-center items-center shadow-md duration-150 ease-in hover:opacity-90 bg-white h-[25vh] p-4 rounded-xl ${
                imageError.main && "text-red-500 border border-red-500"
              }`}
            >
              {newImage.main ? (
                <div className="h-full w-full relative overflow-hidden rounded-md">
                  <img
                    src={URL.createObjectURL(newImage.main)}
                    className=" mx-auto h-full"
                    alt="main image"
                  />
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewImage((prevState) => {
                        const newState = { ...prevState, main: null };
                        return newState;
                      });
                    }}
                    className="absolute group top-0 left-0 h-full w-full flex transition-colors text-white justify-center items-center hover:bg-[rgba(0,0,0,.7)]"
                  >
                    <span className="group-hover:block hidden">
                      CLick to remove image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full relative overflow-hidden rounded-md">
                  <img
                    src={image.main}
                    className=" mx-auto h-full"
                    alt="main image"
                  />
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("mainImage").click();
                    }}
                    className="absolute group top-0 left-0 h-full w-full flex transition-colors text-white justify-center items-center hover:bg-[rgba(0,0,0,.7)]"
                  >
                    <span className="group-hover:block hidden">
                      CLick to update image
                    </span>
                  </div>
                </div>
              )}
              <input
                onChange={handleImageChange}
                name="main"
                id="mainImage"
                className="hidden"
                type="file"
              />
            </div>
            <div className="flex justify-center items-center h-[15vh] gap-2 mx-auto">
              {/* SECONDARY IMAGE */}
              <div
                // onClick={() => {
                //   document.getElementById("secondaryImage").click();
                // }}
                className={` cursor-pointer text-gray-500 hover:text-gray-700 w-full flex justify-center items-center shadow-md hover:shadow-xl hover:scale-[1.05] transition-all duration-150 ease-in hover:opacity-90 bg-white h-full p-4 rounded-xl text-xs ${
                  imageError.secondary && "text-red-500 border border-red-500"
                }`}
              >
                {newImage.secondary ? (
                  <div className="h-full w-full relative overflow-hidden rounded-md">
                    <img
                      src={URL.createObjectURL(newImage.secondary)}
                      className=" mx-auto h-full"
                      alt="secondary image"
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewImage((prevState) => {
                          const newState = { ...prevState, secondary: null };
                          return newState;
                        });
                      }}
                      className="absolute group top-0 left-0 h-full w-full flex text-white transition-colors justify-center items-center hover:bg-[rgba(0,0,0,.7)]"
                    >
                      <span className="group-hover:block hidden">
                        CLick to remove image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full relative overflow-hidden rounded-md">
                    <img
                      src={image.secondary}
                      className=" mx-auto h-full"
                      alt="secondary image"
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("secondaryImage").click();
                      }}
                      className="absolute group top-0 left-0 h-full w-full flex text-white transition-colors justify-center items-center hover:bg-[rgba(0,0,0,.7)]"
                    >
                      <span className="group-hover:block hidden">
                        CLick to update image
                      </span>
                    </div>
                  </div>
                )}
                <input
                  onChange={handleImageChange}
                  name="secondary"
                  id="secondaryImage"
                  className="hidden"
                  type="file"
                />
              </div>
              {/* TERTIARY IMAGE */}
              <div
                onClick={() => {
                  document.getElementById("tertiaryImage").click();
                }}
                className={`hover:shadow-xl hover:scale-[1.05] transition-all cursor-pointer text-gray-500 hover:text-gray-700 w-full flex justify-center items-center shadow-md duration-150 ease-in hover:opacity-90 bg-white h-full p-4 rounded-xl text-xs ${
                  imageError.tertiary && "text-red-500 border border-red-500"
                }`}
              >
                {newImage.tertiary ? (
                  <div className="h-full w-full relative overflow-hidden rounded-md">
                    <img
                      src={URL.createObjectURL(newImage.tertiary)}
                      className=" mx-auto h-full"
                      alt="tertiary image"
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewImage((prevState) => {
                          const newState = { ...prevState, tertiary: null };
                          return newState;
                        });
                      }}
                      className="absolute group top-0 left-0 h-full w-full flex text-white transition-colors justify-center items-center hover:bg-[rgba(0,0,0,.7)]"
                    >
                      <span className="group-hover:block hidden">
                        CLick to remove image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full relative overflow-hidden rounded-md">
                    <img
                      src={image.tertiary}
                      className=" mx-auto h-full"
                      alt="tertiary image"
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("tertiaryImage").click();
                      }}
                      className="absolute group top-0 left-0 h-full w-full flex text-white transition-colors justify-center items-center hover:bg-[rgba(0,0,0,.7)]"
                    >
                      <span className="group-hover:block hidden">
                        CLick to update image
                      </span>
                    </div>
                  </div>
                )}
                <input
                  onChange={handleImageChange}
                  name="tertiary"
                  id="tertiaryImage"
                  className="hidden"
                  type="file"
                />
              </div>
            </div>
            <div className=" w-full flex flex-col gap-2 mt-5">
              <label htmlFor="description">Description</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                id="description"
                placeholder="Description (Optional)"
                className={`flex h-10 w-full rounded-md border border-gray-300 placeholder:text-gray-400
               bg-transparent px-3 py-2 text-sm  focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50`}
              ></textarea>
            </div>
            {/* <button
              type="button"
              className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              Upload Image
            </button> */}
          </div>
          <div className="">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values) => handleSubmit(values)}
            >
              {({
                handleBlur,
                handleChange,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <>
                  <div className=" grid grid-cols-2 gap-4 mb-5">
                    <InputField
                      title="Type"
                      placeHolder="Type"
                      options={CarTypes}
                      type="Select"
                      name="type"
                      handleBlur={handleBlur("type")}
                      handleChange={handleChange("type")}
                      errors={errors?.type}
                      value={values?.type}
                      touched={touched?.type}
                    />

                    <InputField
                      title="Name"
                      placeHolder="Name"
                      name="name"
                      handleBlur={handleBlur("name")}
                      handleChange={handleChange("name")}
                      errors={errors?.name}
                      value={values?.name}
                      touched={touched?.name}
                    />
                  </div>
                  <div className=" grid grid-cols-2 gap-4 mb-5">
                    <InputField
                      title="Model"
                      placeHolder="Model"
                      name="model"
                      type="Number"
                      handleBlur={handleBlur("model")}
                      handleChange={handleChange("model")}
                      errors={errors?.model}
                      value={values?.model}
                      touched={touched?.model}
                    />
                    <InputField
                      title="Door"
                      type="Number"
                      placeHolder="Door"
                      name="door"
                      handleBlur={handleBlur("door")}
                      handleChange={handleChange("door")}
                      errors={errors?.door}
                      value={values?.door}
                      touched={touched?.door}
                    />
                  </div>
                  <div className=" grid grid-cols-2 gap-4 mb-5">
                    <InputField
                      title="Air Conditioner"
                      type="Select"
                      options={["True", "False"]}
                      placeHolder="Air Conditioner"
                      name="air_conditioner"
                      handleBlur={handleBlur("air_conditioner")}
                      handleChange={handleChange("air_conditioner")}
                      errors={errors?.air_conditioner}
                      value={values?.air_conditioner}
                      touched={touched?.air_conditioner}
                    />
                    <InputField
                      title="Fuel Capacity"
                      type="Number"
                      placeHolder="Fuel Capacity"
                      name="fuel_capacity"
                      handleBlur={handleBlur("fuel_capacity")}
                      handleChange={handleChange("fuel_capacity")}
                      errors={errors?.fuel_capacity}
                      value={values?.fuel_capacity}
                      touched={touched?.fuel_capacity}
                    />
                  </div>
                  <div className=" grid grid-cols-2 gap-4 mb-5">
                    <InputField
                      title="Transmission"
                      type="Select"
                      options={["Manual", "Automatic"]}
                      placeHolder="Transmission"
                      name="transmission"
                      handleBlur={handleBlur("transmission")}
                      handleChange={handleChange("transmission")}
                      errors={errors?.transmission}
                      value={values?.transmission}
                      touched={touched?.transmission}
                    />
                    <InputField
                      title="Price"
                      type="Number"
                      placeHolder="Price"
                      name="price"
                      handleBlur={handleBlur("price")}
                      handleChange={handleChange("price")}
                      errors={errors?.price}
                      value={values?.price}
                      touched={touched?.price}
                    />
                  </div>
                  <div className=" grid grid-cols-2 gap-4 mb-5">
                    <InputField
                      title="Capacity"
                      type="Select"
                      options={CarCapacity}
                      placeHolder="Capacity"
                      name="capacity"
                      handleBlur={handleBlur("capacity")}
                      handleChange={handleChange("capacity")}
                      errors={errors?.capacity}
                      value={values?.capacity}
                      touched={touched?.capacity}
                    />
                  </div>
                  <div className=" flex items-center justify-end">
                    <div className="space-x-2">
                      <button
                        onClick={handleSubmit}
                        type="button"
                        className="rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => navigate(-1)}
                        type="button"
                        className="rounded-md bg-red-300 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-300/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCar;
