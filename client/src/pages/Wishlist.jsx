import React from "react";
import Card from "../components/Card";

const Wishlist = () => {
  return (
    <div>
      <div className=" container pb-16">
        <div className="grid grid-cols-4 gap-7 mt-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((e, index) => (
            <Card key={index} isWishlist />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
