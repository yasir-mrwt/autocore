import { Rating } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { asyncAddReview } from "../store/actions/carActions";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../utils/Toast";

const AddReview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, selectedCar, user } = useSelector(
    (state) => state.app
  );

  const [rating, setRating] = useState(0);

  const handleReview = () => {
    if (!isAuthenticated) return navigate("/sign-in");

    const review = {
      carId: selectedCar._id,
      buyerId: user._id,
      rating,
      comment: document.getElementById("comment").value,
    };

    const id = notifyPendingPromise("Adding review...");

    dispatch(asyncAddReview(review)).then((res) => {
      if (res.status == 200) {
        notifySuccessPromise(id, res.message);
        setRating(0);
        document.getElementById("comment").value = "";
      } else notifyErrorPromise(id, res.message);
    });
  };

  return (
    <div className="w-[90vw] mx-auto  border bg-gray-100 text-gray-700 font-semibold text-lg rounded-lg p-3">
      <h3>Add Review</h3>
      <Rating
        name="half-rating"
        defaultValue={0}
        value={rating}
        onChange={(_, value) => setRating(value)}
        precision={0.5}
      />
      <textarea
        onKeyDown={(e) => {
          if (e.key == "Enter") document.getElementById("addReview").click();
        }}
        id="comment"
        className="bg-white font-normal text-sm w-full focus:border-none focus:outline-none p-2 rounded-lg"
        placeholder="Add comments(Optional) "
      />
      <button
        id="addReview"
        onClick={handleReview}
        className="bg-[#1572D3] w-fit px-2 py-2 text-white text-sm rounded-lg mt-3"
      >
        Add Review
      </button>
    </div>
  );
};

export default AddReview;
