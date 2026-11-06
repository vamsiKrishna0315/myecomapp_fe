'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { HiArrowRight } from "react-icons/hi";

function CustomNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      type="button"
      className={`${className || ""} !hidden lg:!flex !w-11 !h-11 !bg-white !shadow-premium hover:!shadow-premium-hover !border !border-gray-200 !rounded-full !items-center !justify-center !text-gray-700 hover:!text-white hover:!bg-brand hover:!border-brand !-right-2 sm:!-right-5 !z-30 transition-all focus:outline-none hover:scale-105 active:scale-95`}
      style={{ ...style }}
      onClick={onClick}
      aria-label="Next slide"
    >
      <ChevronRightIcon className="!w-6 !h-6" />
    </button>
  );
}

function CustomPrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      type="button"
      className={`${className || ""} !hidden lg:!flex !w-11 !h-11 !bg-white !shadow-premium hover:!shadow-premium-hover !border !border-gray-200 !rounded-full !items-center !justify-center !text-gray-700 hover:!text-white hover:!bg-brand hover:!border-brand !-left-2 sm:!-left-5 !z-30 transition-all focus:outline-none hover:scale-105 active:scale-95`}
      style={{ ...style }}
      onClick={onClick}
      aria-label="Previous slide"
    >
      <ChevronLeftIcon className="!w-6 !h-6" />
    </button>
  );
}

const News = () => {
  const [newsData, setNewsData] = useState([]);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    initialSlide: 0,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 1380,
        settings: { slidesToShow: 4, slidesToScroll: 1 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, slidesToScroll: 1, arrows: false },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2.2, slidesToScroll: 1, arrows: false },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1.2, slidesToScroll: 1, arrows: false },
      },
    ],
  };

  useEffect(() => {
    axios
      .get("https://licious-database.vercel.app/news")
      .then((res) => {
        setNewsData(res.data || []);
      })
      .catch(() => {
        setNewsData([]);
      });
  }, []);

  if (!newsData || newsData.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 mt-12 sm:mt-24 mb-10">
      <div className="mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
        <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-brand bg-red-50/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-100/70 inline-flex items-center gap-1.5 mb-1.5 sm:mb-2">
          📰 PRESS & MEDIA
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">In the News</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Updates, press releases and stories about our cold-chain journey</p>
      </div>

      <div className="relative px-0 sm:px-4">
        <Slider {...settings}>
          {newsData
            .filter((el) => el && el.id)
            .map((el) => (
              <div key={el.id} className="p-1.5 sm:p-3">
                <div className="bg-white border border-gray-200/80 hover:border-brand/30 rounded-2xl overflow-hidden shadow-card-subtle hover:shadow-premium-hover transition-all duration-300 h-56 sm:h-64 flex flex-col justify-between hover:-translate-y-1 group">
                  <div className="h-28 sm:h-36 w-full overflow-hidden bg-gray-50 flex items-center justify-center p-3 sm:p-4 border-b border-gray-100">
                    <img
                      src={el.image}
                      alt={el.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                      {el.title}
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 group-hover:text-brand transition-colors mt-1.5 inline-flex items-center gap-1">
                      Read coverage <HiArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </Slider>
      </div>
    </section>
  );
};

export default News;
