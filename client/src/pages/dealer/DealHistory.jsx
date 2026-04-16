import Pagination from "../../components/Pagination";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { asyncGetDealerDeals } from "../../store/actions/dealActions";
import { LoaderCircle } from "lucide-react";

const DealHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, myDeals } = useSelector((state) => state.app);

  const { pathname, search } = useLocation();

  const query = new URLSearchParams(search);

  const [page, setPage] = useState(query.get("page") || 1);

  useEffect(() => {
    document.title = "Deal-History";
  }, []);

  useEffect(() => {
    navigate(`${pathname}?page=${page ? page : 1}`);
  }, [page]);

  useEffect(() => {
    dispatch(asyncGetDealerDeals(user?._id));
  }, []);

  useEffect(() => {
    navigate(`${pathname}?page=${page ? page : 1}`);
  }, []);

  return (
    <>
      <section className="w-full container py-4">
        <div>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-base lg:text-xl font-semibold">History</h2>
              <p className="mt-1 text-sm font-medium text-gray-700"></p>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="overflow-hidden">
              <div className=" flex-1 py-2 align-middle">
                <div
                  id="message-container"
                  className="overflow-x-auto border border-gray-200 md:rounded-lg"
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs lg:text-sm font-semibold text-gray-700"
                        >
                          No.
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs lg:text-sm font-semibold text-gray-700"
                        >
                          <span>User&apos;s Name</span>
                        </th>
                        <th
                          scope="col"
                          className="px-12 py-3.5 text-left text-xs lg:text-sm font-semibold text-gray-700"
                        >
                          Car Name
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs lg:text-sm font-semibold text-gray-700"
                        >
                          Price
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs lg:text-sm font-semibold text-gray-700"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {myDeals ? (
                        myDeals?.map((deal, index) => (
                          <tr key={deal._id || index}>
                            <td className="whitespace-nowrap px-4 py-4 text-xs lg:text-sm font-medium text-gray-700">
                              {index + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={deal?.car_id?.image?.main?.url}
                                    alt="image"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-xs lg:text-sm font-medium text-gray-900">
                                    {deal?.buyer_id?.user_name}
                                  </div>
                                  <div className="text-xs lg:text-sm font-medium text-gray-700">
                                    {deal?.buyer_id?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-12 py-4">
                              <div className="text-xs lg:text-sm font-medium text-gray-900 ">
                                {deal?.car_id?.name}
                              </div>
                              <div className="text-xs lg:text-sm font-medium text-gray-700">
                                {deal?.car_id?.type}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs lg:text-sm font-medium text-gray-700">
                              ₹ {deal?.price.toLocaleString("en-In")}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                Sold
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="w-full p-4">
                            <div className="flex justify-center items-center">
                              <LoaderCircle className="rotate" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Pagination page={page} setPage={setPage} items={user?.deals.length} />
      </section>
    </>
  );
};

export default DealHistory;
