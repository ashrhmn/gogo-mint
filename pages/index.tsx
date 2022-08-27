import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import HeroRight from "../components/SVGs/HeroRight";

const HomePage: NextPage = () => {
  useEffect(() => {
    document.getElementsByTagName("html")[0].style.backgroundColor = "#0c0013";
  }, []);
  return (
    <div className="text-white">
      <div>
        <div className="fixed top-0 left-0 right-0 z-50 nav-container">
          <nav className="flex justify-between items-center w-full max-w-7xl px-3 z-50 mx-auto">
            <Link passHref href={"/"}>
              <a className="relative w-[80px] h-[70px]">
                <Image src={"/assets/logo-main.png"} alt="" layout="fill" />
              </a>
            </Link>
            <div>
              <Link href={"/dashboard"}>
                <a className="nav-right-btn">Go To Dashboard</a>
              </Link>
            </div>
          </nav>
        </div>
        <div className="pt-32 px-3">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
            <div className="relative w-full">
              <div className="hero-left-bg" />
              <div className="hero-left absolute inset-0">
                <h1 className="leading-relaxed text-5xl lg:whitespace-nowrap">
                  Discover, Collect & Sell
                </h1>
                <h1 className="leading-relaxed text-5xl lg:whitespace-nowrap">
                  Popular <span className="hero-span-nft">NFT&apos;s</span>
                </h1>
                <p className="my-3 w-full">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Pariatur ratione fugit illo doloremque saepe sint
                  exercitationem corporis, sequi aliquam nulla nesciunt omnis
                  quo tempore, voluptatum facilis porro neque quasi. Voluptas
                  deserunt harum quaerat beatae quasi!
                </p>
                <div className="mt-10">
                  <Link href={"/"} passHref>
                    <a className="nav-right-btn">Explore Now</a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full">
              <HeroRight />
            </div>
          </div>
          <div className="my-4">
            <div className="hr-grad-line" />
            <div className="flex justify-between divide-x-2 divide-cyan-800 max-w-7xl mx-auto overflow-x-auto">
              {[
                { number: 55, title: "Our Active User" },
                { number: 47, title: "Our Artwork" },
                { number: 20, title: "Available Artists" },
                { number: 22, title: "Our Products" },
              ].map((item, idx) => (
                <div
                  className="flex justify-center w-full px-10 my-10 items-center leading-tight gap-4"
                  key={idx}
                >
                  <div className="text-4xl service-counts">{item.number}K</div>
                  <div className="text-2xl">{item.title}</div>
                </div>
              ))}
            </div>
            <div className="hr-grad-line" />
          </div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between md:gap-4">
            <div className="relative h-96 w-full my-4">
              <div className="mid-bg-grad" />
              <Image
                objectFit="contain"
                src={"/assets/Mask group.png"}
                alt=""
                layout="fill"
              />
            </div>
            <div className="w-full relative">
              <div className="hero-left-bg" />
              <div className="absolute inset-0 flex flex-col justify-center">
                <h1 className="leading-relaxed text-5xl lg:whitespace-nowrap">
                  Awesome <span className="hero-span-nft">NFT&apos;s</span> Art
                </h1>
                <h1 className="leading-relaxed text-5xl lg:whitespace-nowrap">
                  Sell & Earn
                </h1>
                <p className="my-3 w-full">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Pariatur ratione fugit illo doloremque saepe sint
                  exercitationem corporis, sequi aliquam nulla nesciunt omnis
                  quo tempore, voluptatum facilis porro neque quasi. Voluptas
                  deserunt harum quaerat beatae quasi!
                </p>
                <div className="mt-10">
                  <Link href={"/"} passHref>
                    <a className="home-mid-view-more-btn">View More</a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
