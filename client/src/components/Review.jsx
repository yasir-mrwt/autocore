import Rating from "@mui/material/Rating";
import { useSelector, useDispatch } from "react-redux";
import { asyncDeleteReview } from "../store/actions/carActions";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../utils/Toast";

const Review = ({ review }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.app);
  return (
    <div className=" border-b border-gray-500 mb-6 pb-5">
      <div className="flex items-center justify-between">
        <h1 className="md:text-[20px] text-lg font-bold text-gray-600 mt-2 text-nowrap">
          {review.buyer_id.user_name}
        </h1>
        {review.buyer_id._id == user?._id && (
          <button
            onClick={() => {
              const id = notifyPendingPromise("Deleting Review...");
              const reviewId = review._id;
              dispatch(asyncDeleteReview(reviewId)).then((res) => {
                if (res == 200)
                  notifySuccessPromise(id, "Review deleted successfully!");
                else notifyErrorPromise(id, res.message);
              });
            }}
            className="text-xs px-2 py-1 bg-slate-300 rounded-md hover:bg-slate-200 transition-all"
          >
            Delete
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Rating readOnly value={review.rating} precision={0.1} />
      </div>
      <p className="mt-3 text-sm">{review.comment}</p>
    </div>
  );
};

export default Review;
