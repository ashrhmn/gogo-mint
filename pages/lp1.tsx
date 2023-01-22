/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
} from "../components/SVGs/SocialIcons";
import toast from "react-hot-toast";
import { service } from "../service";
import { z } from "zod";

const HomePage2: NextPage = () => {
  const [email, setEmail] = useState("");
  const handleConnectClick = async () => {
    if (!z.string().email().safeParse(email).success) {
      toast.error("Invalid email");
      return;
    }
    toast.promise(service.post(`/email`, { email }), {
      error: "An unknown error occured",
      loading: "Connecting...",
      success: "Thanks for connecting. We will be in touch with you soon.",
    });
  };
  return (
    <div className="text-white relative bg-[#0c0013]">
      <div>
        <div className="fixed top-0 left-0 right-0 z-50 nav-container">
          <nav className="flex justify-between items-center w-full max-w-7xl px-6 z-50 mx-auto py-10">
            <Link passHref href={"/"}>
              <a className="relative w-[80px] h-[70px]">
                <Image src={"/assets/logo-main.png"} alt="" layout="fill" />
              </a>
            </Link>
            <div>
              <a href="/dashboard" className="nav-right-btn">
                Dashboard
              </a>
            </div>
          </nav>
        </div>
        <div className="pt-32">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6">
            <div className="relative w-full">
              <div className="hero-left-bg" />
              <div className="hero-left absolute inset-0">
                <h1 className="leading-relaxed text-5xl lg:whitespace-nowrap">
                  Deploy <span className="hero-span-nft">NFTs</span> in minutes
                </h1>
                <p className="my-3 w-full">
                  Unlock the power of blockchain for your web3 community with
                  hydromint. One-stop NFT platform that enables you to create,
                  launch and manage custom NFTs and smartcontract from your
                  browser.
                </p>
                <div className="mt-10">
                  <Link href={"/"} passHref>
                    <a className="nav-right-btn">Explore Now</a>
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full">
              <img src="/assets/hero-icon.png" alt="" />
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
          {/* <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between md:gap-4 px-6 my-4">
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
                    <a>
                      <div className="home-mid-view-more-btn">
                        <div>View More</div>
                      </div>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div> */}
          <div className="px-6 my-8 max-w-7xl mx-auto">
            <h1 className="text-center text-5xl">
              Featured Artwork Collection
            </h1>
            <div className="md:hidden s360:w-80 mx-auto mt-20">
              <Slider
                {...{
                  dots: true,
                  infinite: true,
                  speed: 500,
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  arrows: false,
                  customPaging() {
                    return (
                      <svg
                        width="30"
                        height="6"
                        viewBox="0 0 59 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.85449 0H59L48.9536 17H0L7.85449 0Z"
                          fill="url(#paint0_linear_74_998)"
                        />
                        <defs>
                          <linearGradient
                            id="paint0_linear_74_998"
                            x1="22.0509"
                            y1="11.0905"
                            x2="34.4559"
                            y2="14.1788"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#4708B5" />
                            <stop offset="1" stopColor="#8906BA" />
                          </linearGradient>
                        </defs>
                      </svg>
                    );
                  },
                }}
              >
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      className={`relative w-full min-h-[300px] s360:h-96`}
                      key={i}
                    >
                      <Image
                        src={`/assets/featured/featured${i + 1}.png`}
                        alt=""
                        layout="fill"
                      />
                    </div>
                  ))}
              </Slider>
            </div>
            <div className="items-center gap-4 mt-20 hidden md:flex">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    style={{
                      height: `${400 - Math.abs(i - 2) * 40}px`,
                    }}
                    className={`relative w-full`}
                    key={i}
                  >
                    <Image
                      src={`/assets/featured/featured${i + 1}.png`}
                      alt=""
                      layout="fill"
                    />
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-purple-grad absolute bottom-[600px] opacity-40 left-0" />
          <div className="bg-blue-grad absolute bottom-[600px] opacity-40 right-0" />
          <div
            id="contact-us"
            className="px-6 py-10 my-28 max-w-7xl mx-auto news-letter-container flex flex-col md:flex-row items-center gap-5"
          >
            <div className="md:w-6/12">
              <h1 className="text-5xl my-4 font-bold">Contact US</h1>
              <p className="my-4">
                Find out more about how we can help empower your web3 community
                business.
              </p>
            </div>
            <div className="md:w-6/12">
              <div className="md:w-3/4 h-16 bg-white skew-x-[-25deg] mx-auto">
                <div className="skew-x-[25deg] p-4 flex items-center h-full">
                  <input
                    className="w-full focus:outline-none text-black"
                    type="text"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    onClick={handleConnectClick}
                    className="bg-[#300576] p-2 text-sm"
                  >
                    CONNECT
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{ width: "50%" }}
            className="bg-purple-grad absolute opacity-50 bottom-[400px] left-0 hidden md:block w-1/2"
          />
          <div className="bg-[#090617] py-8">
            <div className="max-w-7xl px-6 mb-4 flex flex-col md:flex-row gap-4 mx-auto">
              <div className="w-full flex gap-4">
                <div className="w-2/12 flex justify-center items-center">
                  <Link passHref href={"/"}>
                    <a>
                      <div className="relative w-[80px] h-[70px]">
                        <Image
                          src={"/assets/logo-main.png"}
                          alt=""
                          layout="fill"
                        />
                      </div>
                    </a>
                  </Link>
                </div>
                <div className="">
                  <h1 className="mb-4 font-medium">About Us</h1>
                  <p className="my-3 w-full">
                    Hydromint is one of the leading web3 enterprise focusing on
                    providing NFT solutions.
                  </p>
                  <p className="my-3 w-full">
                    Our team has vast experiences in the crypto/finance domain
                    including managing popular NFT projects, consulting web3
                    communities, and building web3 infrastructures.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 my-3 whitespace-nowrap items-center">
              <a
                className="text-blue-400 hover:text-blue-300 transition-colors"
                href="/docs/1. Terms of Service.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Terms Of Service
              </a>
              <a
                className="text-blue-400 hover:text-blue-300 transition-colors"
                href="/docs/2. Privacy Policy.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
            </div>
            <hr />
            <div className="flex justify-end gap-4 my-6 px-10 max-w-7xl mx-auto text-[#FCDDEC]">
              <h1>Hey, come check out Discord with me</h1>
              <a
                target="_blank"
                href="https://discord.gg/HnePMhYhb7"
                className="hover:text-white transition-colors"
                rel="noreferrer"
              >
                <DiscordIcon />
              </a>
              <Link href={`/`}>
                <a className="hover:text-white transition-colors">
                  <FacebookIcon />
                </a>
              </Link>
              <Link href={`/`}>
                <a className="hover:text-white transition-colors">
                  <InstagramIcon />
                </a>
              </Link>
              <Link href={`/`}>
                <a className="hover:text-white transition-colors">
                  <TwitterIcon />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage2;
