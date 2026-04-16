import Rating from "@mui/material/Rating";
import Review from "./Review";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import {
  notifyError,
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../utils/Toast";
import { asyncAddReview } from "../store/actions/carActions";

const RatingAndReview = () => {
  const dispatch = useDispatch();

  const { selectedCar, user, userType } = useSelector((state) => state.app);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleAddReview = () => {
    if (!rating && !comment) return notifyError("No Review given to add!");
    const data = {
      rating,
      comment,
      buyerId: user?._id,
      carId: selectedCar?._id,
    };
    const id = notifyPendingPromise("Add Review...");
    dispatch(asyncAddReview(data)).then((res) => {
      if (res.status == 200) {
        notifySuccessPromise(id, res.message);
        setRating(0);
        setComment("");
      } else notifyErrorPromise(id, res.message);
    });
  };

  return (
    <div className="md:px-8 pt-8 ">
      <div>
        <h4 className=" text-2xl md:text-[30px] text-gray-800 mb-3 font-semibold capitalize pb-2">
          Rating & Review
        </h4>
      </div>
      <div className="md:grid md:grid-cols-12 items-start gap-x-8 mb-20 mt-5">
        <section className=" bg-white col-span-8">
          <section className="rounded-md bg-white col-span-4 mt-0 md:py-4 py-2 px-4 md:px-6 border border-gray-200 mb-3">
            {selectedCar?.review?.map((review, index) => {
              console.log({ review });
              return (
                <Review
                  review={review}
                  key={index}
                />
              );
            })}
            {selectedCar?.review?.length == 0 && <div>No Reviews</div>}
          </section>
        </section>

       {userType !='Dealer' && <section className=" bg-white col-span-4 space-y-8">

          <section className="rounded-md bg-white py-4 px-4 border border-gray-200">
            <p className="font-semibold">Add Review</p>
          <Rating
            value={rating}
            precision={0.5}
            onChange={(_, newValue) => {
              setRating(newValue);
            }}
          />
            <textarea
              onChange={(e) => {
                setComment(e.target.value);
              }}
              value={comment}
              className=" w-full min-h-[8rem] md:min-h-[14rem] lg:min-h-[20rem] border border-gray-200 p-2 rounded-md"
              placeholder="Write what do you think...."
            />
            <div className="flex items-center justify-end">
              <button
                onClick={handleAddReview}
                type="button"
                className="rounded-md bg-black px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                Add
              </button>
            </div>
          </section>
        </section>}
      </div>
    </div>
  );
};

export default RatingAndReview;
