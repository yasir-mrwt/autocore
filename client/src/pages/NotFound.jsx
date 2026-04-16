import { useEffect } from "react";

function NotFound() {
  useEffect(() => {
    document.title = "Not Found";
  }, []);
  return (
    <div className="w-screen h-[60vh] flex  gap-9 items-center text-gray-700  justify-center text-4xl">
      <span>404</span>
      <span>|</span>
      <span>Requested Page Not Found</span>
    </div>
  );
}

export default NotFound;
