import { useEffect, useRef } from "react";
import Hero_img from "/assets/image/hero-part-img1.png";
import Choose_us_img from "/assets/image/choose_us_img.png";
import Arrow from "/assets/icon/arrow.svg";
import Wallet from "/assets/icon/wallet.svg";
import SparePart_img from "/assets/image/spare_part.png";
import Car_logo1 from "/assets/image/car_logo1.png";
import Car_logo2 from "/assets/image/car_logo2.png";
import Car_logo3 from "/assets/image/car_logo3.png";
import Car_logo4 from "/assets/image/car_logo4.png";
import Car_logo5 from "/assets/image/car_logo5.png";
import Car_logo6 from "/assets/image/car_logo6.png";
import Quote_img from "/assets/image/quote_img1.png";
import Quote_img2 from "/assets/image/quote_img2.png";
import User_img from "/assets/image/user_img.png";
import Card from "../components/Card";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { asyncGetAllCars } from "../store/actions/carActions";
import { notifyError } from "../utils/Toast";
import { useLocation } from "react-router-dom";
import { Tag, Flame, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

// Static product data for carousels
const topOnSaleProducts = [
  {
    id: 1,
    name: "Premium Brake Disc Rotor",
    category: "Braking System",
    price: 2499,
    originalPrice: 3999,
    rating: 5,
    reviews: 128,
    badge: "sale",
    image: SparePart_img,
  },
  {
    id: 2,
    name: "Performance Air Filter",
    category: "Engine Parts",
    price: 899,
    originalPrice: 1499,
    rating: 4,
    reviews: 95,
    badge: "sale",
    image: SparePart_img,
  },
  {
    id: 3,
    name: "LED Headlight Assembly",
    category: "Lighting",
    price: 3299,
    originalPrice: 5499,
    rating: 5,
    reviews: 203,
    badge: "sale",
    image: SparePart_img,
  },
  {
    id: 4,
    name: "Ceramic Brake Pads Set",
    category: "Braking System",
    price: 1599,
    originalPrice: 2299,
    rating: 4,
    reviews: 167,
    badge: "sale",
    image: SparePart_img,
  },
  {
    id: 5,
    name: "Shock Absorber Kit",
    category: "Suspension",
    price: 4299,
    originalPrice: 6999,
    rating: 5,
    reviews: 84,
    badge: "sale",
    image: SparePart_img,
  },
  {
    id: 6,
    name: "Radiator Coolant Hose",
    category: "Cooling System",
    price: 649,
    originalPrice: 999,
    rating: 4,
    reviews: 56,
    badge: "sale",
    image: SparePart_img,
  },
];

const hotSellingProducts = [
  {
    id: 7,
    name: "Engine Oil Filter Premium",
    category: "Engine Parts",
    price: 399,
    rating: 5,
    reviews: 342,
    badge: "hot",
    image: SparePart_img,
  },
  {
    id: 8,
    name: "Alloy Wheel Rim 17\"",
    category: "Wheels & Tires",
    price: 5999,
    rating: 5,
    reviews: 276,
    badge: "hot",
    image: SparePart_img,
  },
  {
    id: 9,
    name: "Spark Plug Iridium Set",
    category: "Ignition",
    price: 1299,
    rating: 4,
    reviews: 189,
    badge: "hot",
    image: SparePart_img,
  },
  {
    id: 10,
    name: "Timing Belt Kit",
    category: "Engine Parts",
    price: 2899,
    rating: 5,
    reviews: 154,
    badge: "hot",
    image: SparePart_img,
  },
  {
    id: 11,
    name: "Power Steering Pump",
    category: "Steering",
    price: 3499,
    rating: 4,
    reviews: 98,
    badge: "hot",
    image: SparePart_img,
  },
  {
    id: 12,
    name: "Clutch Plate Assembly",
    category: "Transmission",
    price: 2199,
    rating: 5,
    reviews: 221,
    badge: "hot",
    image: SparePart_img,
  },
];

const HomePage = () => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, allCars } = useSelector((state) => state.app);

  const saleCarouselRef = useRef(null);
  const hotCarouselRef = useRef(null);

  useEffect(() => {
    const scrollToSection = () => {
      if (search.includes("choose")) {
        const section = document.getElementById("why-choose-us");
        section.scrollIntoView({ behavior: "smooth" });
      } else if (search.includes("testimonials")) {
        const section = document.getElementById("testimonials");
        section.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    scrollToSection();
  }, [search]);

  useEffect(() => {
    if (isAuthenticated)
      dispatch(asyncGetAllCars()).then((res) => {
        if (res != 200) notifyError(res.message);
      });
  }, [isAuthenticated]);

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const whyChooseUsData = [
    {
      title: "Best Price Guaranteed",
      desc: "Find a lower price? We'll refund you 100% of the difference.",
    },
    {
      title: "Verified OEM Parts",
      desc: "Every part is verified for authenticity and compatibility with your vehicle.",
    },
    {
      title: "Fast & Free Shipping",
      desc: "Get your parts delivered quickly with free shipping on orders above ₹999.",
    },
    {
      title: "24/7 Customer Support",
      desc: "Our dedicated support team is here round the clock for any assistance you need.",
    },
  ];

  return (
    <div className="relative mt-20 md:mt-0 overflow-x-hidden">
      {/* ===== HERO SECTION ===== */}
      <div className="container 2xl:relative flex md:flex-row flex-col items-center justify-start md:h-screen px-4 md:px-3">
        <div className="flex flex-col justify-center">
          <div className="relative md:-mt-60 lg:-mt-80 2xl:mb-0">
            <div className="relative w-full md:w-fit">
              <h1 className="md:text-[48px] text-3xl w-full text-center md:text-start font-semibold text-[#242424] md:leading-[50px]">
                Find the Right <br /> Car Parts{" "}
                <span className="text-[#1572D3]">Fast</span>
              </h1>
              <img
                src={Arrow}
                alt="icon"
                className="absolute right-0 bottom-[-15px] hidden md:flex"
              />
            </div>
            <p className="text-sm md:text-lg text-[#272727] font-medium leading-6 mt-3 md:mt-7 text-center md:text-start">
              Shop high-quality auto parts, accessories, and essentials <br />
              for every make and model — all in one place. <br />
              Reliable parts, great prices, and delivery you can count on.
            </p>
          </div>
          <div>
            <img
              src={Hero_img}
              alt="hero img"
              className="md:absolute z-[-10] md:right-0 md:top-0"
            />
          </div>
        </div>
      </div>

      {/* ===== BRAND LOGOS ===== */}
      <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 my-20 px-4">
        {[Car_logo1, Car_logo2, Car_logo3, Car_logo4, Car_logo5, Car_logo6].map(
          (e, index) => (
            <div key={index} className="flex-shrink-0">
              <img src={e} alt="brand logo" className="object-cover h-8 md:h-auto" />
            </div>
          )
        )}
      </div>

      {/* ===== WHY CHOOSE US ===== */}
      <section
        id="why-choose-us"
        className="relative container my-10 md:my-20 px-4"
      >
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          {/* Image */}
          <div className="w-full lg:w-1/2 flex-shrink-0">
            <img
              src={Choose_us_img}
              alt="Why choose us"
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>

          {/* Content */}
          <div className="w-full lg:w-1/2">
            <span className="py-3 px-6 bg-[#E8F1FB] text-[#1572D3] text-sm font-medium rounded-lg inline-block">
              WHY CHOOSE US
            </span>
            <h2 className="md:text-[38px] text-2xl font-medium text-[#333333] md:leading-[45px] mt-6">
              We offer the best experience <br className="hidden md:block" /> with our auto parts
            </h2>
            <div className="mt-6">
              {whyChooseUsData.map((item, index) => (
                <div key={index} className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#ECF5FF] rounded-xl flex-shrink-0">
                    <img src={Wallet} alt="" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-black">
                      {item.title}
                    </h3>
                    <p className="text-sm md:text-base text-slate-600 font-normal mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOP ON SALE CAROUSEL ===== */}
      <div className="container px-4">
        <div className="product-section">
          <div className="product-section-header">
            <div className="product-section-title-group">
              <div className="product-section-icon sale">
                <Tag size={22} />
              </div>
              <div>
                <h2 className="product-section-title">Top on Sale</h2>
                <p className="product-section-subtitle">
                  Best deals on premium auto parts
                </p>
              </div>
            </div>
            <Link to="/cars?page=1" className="product-section-view-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-carousel-wrapper">
            <button
              className="carousel-nav-btn left"
              onClick={() => scrollCarousel(saleCarouselRef, "left")}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="product-carousel" ref={saleCarouselRef}>
              {topOnSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <button
              className="carousel-nav-btn right"
              onClick={() => scrollCarousel(saleCarouselRef, "right")}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ===== HOT SELLING CAROUSEL ===== */}
        <div className="product-section">
          <div className="product-section-header">
            <div className="product-section-title-group">
              <div className="product-section-icon hot">
                <Flame size={22} />
              </div>
              <div>
                <h2 className="product-section-title">Hot Selling</h2>
                <p className="product-section-subtitle">
                  Most popular parts this month
                </p>
              </div>
            </div>
            <Link to="/cars?page=1" className="product-section-view-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="product-carousel-wrapper">
            <button
              className="carousel-nav-btn left"
              onClick={() => scrollCarousel(hotCarouselRef, "left")}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="product-carousel" ref={hotCarouselRef}>
              {hotSellingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <button
              className="carousel-nav-btn right"
              onClick={() => scrollCarousel(hotCarouselRef, "right")}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== ALL PARTS ===== */}
      <div className="container px-4">
        <h2 className="md:text-[38px] text-3xl mt-10 font-medium text-black text-center">
          All Parts
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-7 mt-6">
          {allCars
            ?.filter((car) => !car.sold)
            .slice(0, 4)
            .map((car, index) => (
              <Card key={index} car={car} />
            ))}
        </div>

        <div className="flex items-center justify-center mt-12 mb-10">
          <Link
            to={`/cars?page=1`}
            className="bg-[#1572D3] hover:bg-[#0d5bb5] transition-all text-white font-semibold px-10 py-3 rounded-xl flex items-center gap-2"
          >
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="bg-[#F7FBFF] mt-10 pb-20">
        <div className="container pt-10 md:pt-32 relative px-4">
          <div className="flex items-center justify-center flex-col">
            <span className="py-3 px-6 bg-[#E8F1FB] text-[#1572D3] text-sm font-medium rounded-lg">
              TESTIMONIALS
            </span>
            <h2 className="md:text-[38px] text-[30px] font-medium text-black text-center mt-3">
              What people say about us?
            </h2>
            <div className="absolute left-10 top-20 hidden md:flex">
              <img src={Quote_img} alt="" />
            </div>
            <div className="absolute top-0 right-10 z-0 hidden md:flex">
              <img src={Quote_img2} alt="" />
            </div>
          </div>
          <div className="md:px-52 px-2">
            <div className="bg-white md:flex items-start rounded-3xl overflow-hidden md:mt-20 mt-10 relative z-10 shadow-lg">
              <div className="h-full flex-shrink-0">
                <img
                  src={User_img}
                  alt=""
                  className="h-full rounded-3xl object-cover"
                />
              </div>
              <div className="px-4 md:ml-7 md:w-[500px] flex flex-col justify-between h-full py-6">
                <div>
                  <h3 className="md:text-[64px] text-[32px]">
                    5.0 <span className="md:text-[24px]">stars</span>
                  </h3>
                  <p className="md:text-lg text-[#282828] font-medium">
                    &ldquo;I feel very secure when using AutoCore services. Their parts
                    quality is excellent and delivery is always on time. Highly recommended!&rdquo;
                  </p>
                </div>
                <div className="flex items-start flex-col pb-2 mt-4">
                  <span className="md:text-[24px] font-medium text-black">
                    Charlie Johnson
                  </span>
                  <span className="md:text-sm font-normal text-[#838383]">
                    From New York, US
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
