import { useState } from "react";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import InputField from "../../components/formik/InputField";
import { useDispatch } from "react-redux";
import { asyncBuyerSignIn } from "../../store/actions/appActions";
import {
  notifyError,
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../../utils/Toast";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "../../services/authService";

const validationSchema = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const resetInitialValues = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

const SignInBuyer = () => {
  const initialValues = {
    email: "",
    password: "",
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState("email");
  const [resetValues, setResetValues] = useState(resetInitialValues);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleSubmit = (val) => {
    const id = notifyPendingPromise("Signing in buyer...");
    dispatch(asyncBuyerSignIn(val)).then((res) => {
      if (res == 200) {
        navigate("/");
        notifySuccessPromise(id, "Buyer signed in successfully!");
      } else {
        console.log(res);
        notifyErrorPromise(id, res.message);
      }
    });
  };

  const updateResetValue = (field) => (event) => {
    setResetValues((values) => ({ ...values, [field]: event.target.value }));
  };

  const requestResetOtp = async (event) => {
    event.preventDefault();
    const email = resetValues.email.trim();
    if (!email) {
      notifyError("Enter your email address first.");
      return;
    }

    const id = notifyPendingPromise("Sending password reset OTP...");
    setResetSubmitting(true);
    try {
      await requestPasswordReset(email);
      setResetStep("otp");
      notifySuccessPromise(id, "If the email exists, an OTP has been sent.");
    } catch (error) {
      notifyErrorPromise(
        id,
        error?.response?.data?.message || "Could not send password reset OTP."
      );
    } finally {
      setResetSubmitting(false);
    }
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    if (resetValues.newPassword !== resetValues.confirmPassword) {
      notifyError("New password and confirm password must match.");
      return;
    }

    const id = notifyPendingPromise("Resetting password...");
    setResetSubmitting(true);
    try {
      await confirmPasswordReset({
        email: resetValues.email.trim(),
        otp: resetValues.otp.trim(),
        newPassword: resetValues.newPassword,
        confirmPassword: resetValues.confirmPassword,
      });
      setResetValues(resetInitialValues);
      setResetStep("email");
      setResetMode(false);
      notifySuccessPromise(id, "Password reset. Please sign in with your new password.");
    } catch (error) {
      notifyErrorPromise(
        id,
        error?.response?.data?.message || "Could not reset password."
      );
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 pb-14 container">
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md">
            {resetMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetStep("email");
                  }}
                  className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#E8F1FB] text-[#1572D3]">
                      <MailCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-bold leading-tight text-black">
                        Reset password
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Enter your email, then use the OTP we send to create a new password.
                      </p>
                    </div>
                  </div>

                  {resetStep === "email" ? (
                    <form className="space-y-4" onSubmit={requestResetOtp}>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Email</span>
                        <input
                          type="email"
                          value={resetValues.email}
                          onChange={updateResetValue("email")}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1572D3]"
                          placeholder="Email address"
                          required
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={resetSubmitting}
                        className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {resetSubmitting ? "Sending..." : "Send OTP"}
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-4" onSubmit={confirmReset}>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Email</span>
                        <input
                          type="email"
                          value={resetValues.email}
                          onChange={updateResetValue("email")}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1572D3]"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">OTP</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength="6"
                          value={resetValues.otp}
                          onChange={updateResetValue("otp")}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm tracking-[0.3em] outline-none focus:border-[#1572D3]"
                          placeholder="000000"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">New password</span>
                        <input
                          type="password"
                          minLength="8"
                          value={resetValues.newPassword}
                          onChange={updateResetValue("newPassword")}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1572D3]"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                        <input
                          type="password"
                          minLength="8"
                          value={resetValues.confirmPassword}
                          onChange={updateResetValue("confirmPassword")}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1572D3]"
                          required
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={resetSubmitting}
                        className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {resetSubmitting ? "Resetting..." : "Reset password"}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl">
                  Sign in
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    to={`/sign-up`}
                    title=""
                    className="font-semibold text-black transition-all duration-200 hover:underline"
                  >
                    Create a free account
                  </Link>
                </p>
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
                    setValues,
                  }) => (
                    <div className="space-y-5 mt-5">
                      <InputField
                        title="Email"
                        name="email"
                        type="email"
                        placeHolder="Email address"
                        handleBlur={handleBlur("email")}
                        handleChange={handleChange("email")}
                        errors={errors?.email}
                        value={values?.email}
                        touched={touched?.email}
                      />
                      <InputField
                        title="Password"
                        name="password"
                        type="password"
                        placeHolder="Password"
                        handleBlur={handleBlur("password")}
                        handleChange={handleChange("password")}
                        errors={errors?.password}
                        value={values?.password}
                        touched={touched?.password}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setResetValues((current) => ({
                              ...current,
                              email: values.email,
                            }));
                            setResetMode(true);
                          }}
                          className="text-sm font-semibold text-[#1572D3] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setValues({
                              email: "buyer@example.com",
                              password: "Password123!",
                            });
                          }}
                          className="inline-flex mb-3 w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                        >
                          Try Dummy
                        </button>
                        <button
                          onClick={handleSubmit}
                          type="button"
                          className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                        >
                          Get started <ArrowRight className="ml-2" size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </Formik>
              </>
            )}
            <div className="mt-3 space-y-3">
              {/* <button
                type="button"
                className="relative inline-flex w-full items-center justify-center rounded-md border border-gray-400 bg-white px-3.5 py-2.5 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black focus:outline-none"
              >
                <span className="mr-2 inline-block">
                  <svg
                    className="h-6 w-6 text-rose-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"></path>
                  </svg>
                </span>
                Sign in with Google
              </button> */}
            </div>
          </div>
        </div>
        <div className="h-full w-full overflow-hidden">
          <video
            src="/assets/video/sign-in.mp4"
            loop
            autoPlay
            muted
            className="h-full mt-[-5vh] pointer-events-none"
          />
        </div>
      </div>
    </section>
  );
};

export default SignInBuyer;
