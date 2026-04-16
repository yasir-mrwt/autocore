import { useEffect, useState } from "react";

const Pagination = ({ page, setPage, items, showItems = 10 }) => {
  const [pages] = useState(Math.ceil(items / showItems));

  const [pageNumber, setPageNumber] = useState([]);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let pageNumberArr = [];
    let currentPageNumbers = [];

    for (let i = 1; i <= pages; i++) {
      currentPageNumbers.push(i);

      if (i % 5 === 0 || i === pages) {
        pageNumberArr.push(currentPageNumbers);
        currentPageNumbers = [];
      }
    }

    setPageNumber(pageNumberArr);
  }, [pages]);

  const handlePrevious = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleNext = () => {
    if (current < pageNumber.length) setCurrent(current + 1);
  };

  const handleButton = (value) => {
    setPage(value);
  };

  return (
    <div className="flex items-center justify-end pt-6">
      <button
        disabled={current == 0}
        onClick={handlePrevious}
        className={`mx-1  text-sm font-semibold text-gray-900 ${
          current == 0 ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="hidden lg:block">&larr; Previous</span>
        <span className="block lg:hidden">&larr;</span>
      </button>
      <div id="page-number" className="flex">
        {pageNumber &&
          pageNumber[current]?.map((number) => {
            return (
              <p
                key={number}
                value={number}
                onClick={() => handleButton(number)}
                className={`mx-1 flex items-center cursor-pointer  rounded-md border-2 transition-all border-gray-400 px-3 py-1 text-gray-900 hover:scale-105 ${
                  page == number
                    ? "border-gray-900  bg-white scale-110"
                    : "bg-gray-200"
                }`}
              >
                {number}
              </p>
            );
          })}
      </div>
      <button
        onClick={handleNext}
        disabled={current == pageNumber.length - 1}
        className={`mx-2 text-sm font-semibold text-gray-900  ${
          current == pageNumber.length - 1
            ? "cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        <span className="hidden lg:block">Next &rarr;</span>
        <span className="block lg:hidden">&rarr;</span>
      </button>
    </div>
  );
};

export default Pagination;
