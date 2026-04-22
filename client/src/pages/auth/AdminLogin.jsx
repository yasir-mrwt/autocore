import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  notifyErrorPromise,
  notifyPendingPromise,
  notifySuccessPromise,
} from "../../utils/Toast";
import { useDispatch } from "react-redux";
import { asyncAdminSignIn } from "../../store/actions/appActions";
import { Formik } from "formik";
import * as Yup from "yup";
import InputField from "../../components/formik/InputField";
import { useEffect } from "react";

const initialValues = {
  email: "",
  password: "",
};

const validationSchema = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AutoCore Admin Login";
  }, []);

  const handleSubmit = (val) => {
    const id = notifyPendingPromise("Signing in admin...");
    dispatch(asyncAdminSignIn(val)).then((res) => {
      if (res == 200) {
        notifySuccessPromise(id, "Admin signed in successfully!");
        navigate("/admin");
      } else {
        notifyErrorPromise(id, res.message);
      }
    });
  };

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 pb-14 container">
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Use the admin account created from the backend seed command.
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
                    name="passsword"
                    type="password"
                    placeHolder="Password"
                    handleBlur={handleBlur("password")}
                    handleChange={handleChange("password")}
                    errors={errors?.password}
                    value={values?.password}
                    touched={touched?.password}
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setValues({
                          email: "admin@autocore.local",
                          password: "change-this-admin-password",
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

export default AdminLogin;
