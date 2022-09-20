import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IS_DISCLAIMER_SHOWN_KEY } from "../../constants/configuration";

const DisclaimerModal = () => {
  const [isModalActive, setIsModalActive] = useState(false);
  const [isCheckMarked, setIsCheckMarked] = useState(false);

  useEffect(() => {
    const isDisclaimerShown = localStorage.getItem(IS_DISCLAIMER_SHOWN_KEY);
    if (!isDisclaimerShown) setIsModalActive(true);
  }, []);

  const handleAcceptClick = () => {
    if (!isCheckMarked) {
      toast.error("You must check the tickmark to continue");
      return;
    }
    setIsModalActive(false);
    localStorage.setItem(IS_DISCLAIMER_SHOWN_KEY, "nQTR3VjtB2KS6EwXVctapnNE");
  };

  if (isModalActive)
    return (
      <div className="text-gray-300 fixed inset-0 bg-black/80 z-50 flex justify-center items-center">
        <div className="bg-gray-800 max-w-2xl mx-auto p-7 rounded-xl shadow-2xl shadow-gray-800/30">
          <h1 className="text-3xl md:text-4xl my-4 font-medium">
            Welcome to HydroMint
          </h1>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isCheckMarked}
              onChange={(e) => setIsCheckMarked(e.target.checked)}
            />
            <p className="max-h-[70vh] overflow-y-auto">
              By clicking “Accept” I agree to the{" "}
              <Link href={"/docs/1. Terms of Service.pdf"} passHref>
                <a className="text-blue-500">Terms of Service</a>
              </Link>{" "}
              and{" "}
              <Link href={"/docs/2. Privacy Policy.pdf"} passHref>
                <a className="text-blue-500">Privacy Policy</a>
              </Link>
            </p>
          </div>
          <div className="flex flex-col s360:flex-row justify-end gap-4 my-3">
            <Link href={"/"} passHref>
              <button className="bg-red-600 hover:bg-red-700 transition-colors rounded p-2 w-full s360:w-28">
                Decline
              </button>
            </Link>
            <button
              onClick={handleAcceptClick}
              className="bg-blue-600 hover:bg-blue-700 transition-colors rounded p-2 w-full s360:w-28"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );

  return <></>;
};

export default DisclaimerModal;
