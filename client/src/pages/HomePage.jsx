import { useEffect, useRef, useState } from "react";
import Hero_img from "/assets/image/hero_img.png";
import Choose_us_img from "/assets/image/choose_us_img.png";
import Arrow from "/assets/icon/arrow.svg";
import Wallet from "/assets/icon/wallet.svg";
import Car_logo1 from "/assets/image/car_logo1.png";
import Car_logo2 from "/assets/image/car_logo2.png";
import Car_logo3 from "/assets/image/car_logo3.png";
import Car_logo4 from "/assets/image/car_logo4.png";
import Car_logo5 from "/assets/image/car_logo5.png";
import Car_logo6 from "/assets/image/car_logo6.png";
import Quote_img from "/assets/image/quote_img1.png";
import Quote_img2 from "/assets/image/quote_img2.png";
import User_img from "/assets/image/user_img.png";
import ProductCard from "../components/ProductCard";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Tag } from "lucide-react";
import { getProducts } from "../services/catalogService";

const HomePage = () => {
  const { search } = useLocation();
  const saleCarouselRef = useRef(null);
  const hotCarouselRef = useRef(null);

  const [saleProducts, setSaleProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const scrollToSection = () => {
      if (search.includes("choose")) {
        document
          .getElementById("why-choose-us")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (search.includes("testimonials")) {
        document
          .getElementById("testimonials")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (search.includes("contact")) {
        document
          .getElementById("contact")
          ?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    scrollToSection();
  }, [search]);

  useEffect(() => {
    let active = true;

    setProductsLoading(true);
    Promise.all([
      getProducts({ onSale: "true", sort: "popular", limit: 8 }),
      getProducts({ sort: "popular", limit: 8 }),
      getProducts({ sort: "newest", limit: 8 }),
    ])
      .then(([saleData, hotData, featuredData]) => {
        if (!active) return;
        setSaleProducts(saleData.products);
        setHotProducts(hotData.products);
        setFeaturedProducts(featuredData.products);
      })
      .catch(() => {
        if (!active) return;
        setSaleProducts([]);
        setHotProducts([]);
        setFeaturedProducts([]);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -340 : 340,
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
      desc: "Get your parts delivered quickly with free shipping on orders above Rs 999.",
    },
    {
      title: "24/7 Customer Support",
      desc: "Our dedicated support team is here round the clock for any assistance you need.",
    },
  ];

  const ProductCarousel = ({ title, subtitle, icon, products, carouselRef, type }) => (
    <div className="product-section">
      <div className="product-section-header-center">
        <div className={`product-section-icon ${type}`}>{icon}</div>
        <h2 className="product-section-title">{title}</h2>
        <p className="product-section-subtitle">{subtitle}</p>
      </div>

      <div className="product-carousel-wrapper">
        <button
          className="carousel-nav-btn left"
          onClick={() => scrollCarousel(carouselRef, "left")}
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="product-carousel" ref={carouselRef}>
          {productsLoading
            ? [...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="h-80 min-w-[220px] max-w-[260px] animate-pulse rounded-lg bg-white md:min-w-[260px] md:max-w-[300px]"
                />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
        <button
          className="carousel-nav-btn right"
          onClick={() => scrollCarousel(carouselRef, "right")}
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/shop?page=1" className="product-section-view-all">
          View All Parts <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-x-hidden">
      <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden pl-4 md:flex-row md:pl-[4vw]">
        <div className="order-1 flex w-full flex-col justify-center pr-4 pt-28 md:order-1 md:w-[42%] md:pr-0 md:pt-0">
          <div className="relative w-full md:w-fit">
            <h1 className="w-full text-center text-3xl font-semibold text-[#242424] md:text-start md:text-[48px] md:leading-[50px]">
              Find the Right <br /> Car Parts{" "}
              <span className="text-[#1572D3]">Fast</span>
            </h1>
            <img
              src={Arrow}
              alt="icon"
              className="absolute bottom-[-15px] right-0 hidden md:flex"
            />
          </div>
          <p className="mt-3 text-center text-sm font-medium leading-6 text-[#272727] md:mt-7 md:text-start md:text-lg">
            Shop high-quality auto parts, accessories, and essentials{" "}
            <br className="hidden md:block" />
            for every make and model, all in one place.{" "}
            <br className="hidden md:block" />
            Reliable parts, great prices, and delivery you can count on.
          </p>
          <div className="mt-6 flex justify-center md:justify-start">
            <Link
              to="/shop?page=1"
              className="flex items-center gap-2 rounded-xl bg-[#1572D3] px-8 py-3 font-semibold text-white transition-all hover:bg-[#0d5bb5]"
            >
              Shop Now <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="order-2 mt-8 flex w-full justify-center md:order-2 md:mt-0 md:w-[58%] md:justify-end">
          <img
            src={Hero_img}
            alt="hero img"
            className="w-[112%] max-w-2xl object-contain md:w-[132%] md:max-w-none lg:w-[146%] xl:w-[156%] 2xl:w-[162%]"
          />
        </div>
      </div>

      <div className="container px-4 py-16">
        <div className="brand-marquee">
          <div className="brand-marquee-track">
            {[
              Car_logo1,
              Car_logo2,
              Car_logo3,
              Car_logo4,
              Car_logo5,
              Car_logo6,
              Car_logo1,
              Car_logo2,
              Car_logo3,
              Car_logo4,
              Car_logo5,
              Car_logo6,
            ].map((logo, index) => (
              <div key={index} className="brand-marquee-item">
                <img src={logo} alt="brand logo" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <section id="why-choose-us" className="relative my-10 md:my-20">
        <div className="flex flex-col items-stretch gap-0 lg:flex-row">
          <div className="w-full flex-shrink-0 lg:w-1/2">
            <img
              src={Choose_us_img}
              alt="Why choose us"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex w-full items-center px-6 py-10 md:px-12 lg:w-1/2 lg:px-16 lg:py-0">
            <div>
              <span className="inline-block rounded-lg bg-[#E8F1FB] px-6 py-3 text-sm font-medium text-[#1572D3]">
                WHY CHOOSE US
              </span>
              <h2 className="mt-6 text-2xl font-medium text-[#333333] md:text-[38px] md:leading-[45px]">
                We offer the best experience{" "}
                <br className="hidden md:block" /> with our auto parts
              </h2>
              <div className="mt-6">
                {whyChooseUsData.map((item) => (
                  <div key={item.title} className="mb-6 flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-xl bg-[#ECF5FF] p-3">
                      <img src={Wallet} alt="" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-black md:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm font-normal text-slate-600 md:text-base">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4">
        <ProductCarousel
          title="Top on Sale"
          subtitle="Best deals on premium auto parts"
          icon={<Tag size={22} />}
          products={saleProducts}
          carouselRef={saleCarouselRef}
          type="sale"
        />

        <ProductCarousel
          title="Hot Selling"
          subtitle="Most popular parts this month"
          icon={<Flame size={22} />}
          products={hotProducts}
          carouselRef={hotCarouselRef}
          type="hot"
        />
      </div>

      <div className="container px-4">
        <h2 className="mt-10 text-center text-3xl font-medium text-black md:text-[38px]">
          All Parts
        </h2>

        <div className="mt-6 grid gap-7 md:grid-cols-2 lg:grid-cols-4">
          {productsLoading
            ? [...Array(4)].map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-lg bg-white" />
              ))
            : featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        <div className="mb-10 mt-12 flex items-center justify-center">
          <Link
            to="/shop?page=1"
            className="flex items-center gap-2 rounded-xl bg-[#1572D3] px-10 py-3 font-semibold text-white transition-all hover:bg-[#0d5bb5]"
          >
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <section id="testimonials" className="mt-10 bg-[#F7FBFF] pb-20">
        <div className="container relative px-4 pt-10 md:pt-32">
          <div className="flex flex-col items-center justify-center">
            <span className="rounded-lg bg-[#E8F1FB] px-6 py-3 text-sm font-medium text-[#1572D3]">
              TESTIMONIALS
            </span>
            <h2 className="mt-3 text-center text-[30px] font-medium text-black md:text-[38px]">
              What people say about us?
            </h2>
            <div className="absolute left-10 top-20 hidden md:flex">
              <img src={Quote_img} alt="" />
            </div>
            <div className="absolute right-10 top-0 z-0 hidden md:flex">
              <img src={Quote_img2} alt="" />
            </div>
          </div>
          <div className="px-2 md:px-52">
            <div className="relative z-10 mt-10 overflow-hidden rounded-3xl bg-white shadow-lg md:mt-20 md:flex md:items-start">
              <div className="h-full flex-shrink-0">
                <img
                  src={User_img}
                  alt=""
                  className="h-full rounded-3xl object-cover"
                />
              </div>
              <div className="flex h-full flex-col justify-between px-4 py-6 md:ml-7 md:w-[500px]">
                <div>
                  <h3 className="text-[32px] md:text-[64px]">
                    5.0 <span className="md:text-[24px]">stars</span>
                  </h3>
                  <p className="text-[#282828] font-medium md:text-lg">
                    &ldquo;I feel very secure when using AutoCore services. Their parts
                    quality is excellent and delivery is always on time. Highly recommended!&rdquo;
                  </p>
                </div>
                <div className="mt-4 flex flex-col items-start pb-2">
                  <span className="font-medium text-black md:text-[24px]">
                    Charlie Johnson
                  </span>
                  <span className="font-normal text-[#838383] md:text-sm">
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
