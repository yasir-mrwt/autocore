import { Clock3, Mail, Phone, ShoppingBag, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.app?.user);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container px-4 py-10">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-[#E8F1FB] text-[#1572D3]">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1572D3]">
                Profile
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">
                {user?.user_name || user?.name || "AutoCore Customer"}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 px-4 py-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Account details</h2>
          <div className="mt-5 grid gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <Mail className="h-5 w-5 text-[#1572D3]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.email || "Not added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <Phone className="h-5 w-5 text-[#1572D3]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Phone
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.phone || "Not added"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Quick access</h2>
          <div className="mt-5 grid gap-3">
            <Link
              to="/buyer/watch-list"
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-[#1572D3] hover:text-[#1572D3]"
            >
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Activity and tracking
              </span>
              <span>View</span>
            </Link>
            <Link
              to="/shop?page=1"
              className="flex items-center justify-between rounded-lg bg-[#1572D3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d5bb5]"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Continue shopping
              </span>
              <span>Shop</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;
