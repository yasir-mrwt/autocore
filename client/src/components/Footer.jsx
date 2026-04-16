import Logo from "./Logo";

const Footer = () => {
  return (
    <section className="relative overflow-hidden py-10 bg-[#051C34] text-white">
      <div className="relative z-10 container px-4">
        <div className="-m-6 flex flex-wrap">
          <div className="w-full p-6 md:w-1/2 lg:w-5/12">
            <div className="flex h-full flex-col justify-between">
              <div className=" flex items-center  gap-3">
                <Logo color="white" />
                <h1 className=" text-sm md:text-base text-white font-semibold">
                  AutoCore
                </h1>
              </div>
              <div>
                <p className="mb-4  text-sm md:text-base font-medium">
                  Simplifying Car Parts Buying.
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  © Copyright {new Date().getFullYear()}. All Rights Reserved by AutoCore.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full p-6 md:w-1/2 lg:w-2/12">
            <div className="h-full">
              <h3 className="tracking-px mb-5  text-lg font-semibold uppercase text-white">
                Company
              </h3>
              <ul>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Features
                  </a>
                </li>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Pricing
                  </a>
                </li>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Affiliate Program
                  </a>
                </li>
                <li>
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Press Kit
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-full p-6 md:w-1/2 lg:w-2/12">
            <div className="h-full">
              <h3 className="tracking-px mb-5  text-lg font-semibold uppercase text-white">
                Support
              </h3>
              <ul>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Account
                  </a>
                </li>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Help
                  </a>
                </li>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Customer Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-full p-6 md:w-1/2 lg:w-3/12">
            <div className="h-full">
              <h3 className="tracking-px mb-5  text-lg font-semibold uppercase text-white">
                Legals
              </h3>
              <ul>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Terms &amp; Conditions
                  </a>
                </li>
                <li className="mb-4">
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a className=" text-sm md:text-base font-medium text-[#D6D6D6]" href="#">
                    Licensing
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
