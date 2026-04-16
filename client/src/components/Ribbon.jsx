const Ribbon = ({ tag }) => {
  return (
    <div
      className={`${
        tag == "Active"
          ? "bg-green-400"
          : tag == "Ongoing"
          ? "bg-yellow-400"
          : "bg-red-400"
      } absolute top-[20px] left-[-25px]  z-20 px-10 -rotate-45 font-semibold text-base `}
    >
      {tag}
    </div>
  );
};

export default Ribbon;
