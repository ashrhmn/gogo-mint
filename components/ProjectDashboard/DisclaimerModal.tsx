import Link from "next/link";
import React, { useEffect, useState } from "react";
import { IS_DISCLAIMER_SHOWN_KEY } from "../../constants/configuration";

const DisclaimerModal = () => {
  const [isModalActive, setIsModalActive] = useState(false);

  useEffect(() => {
    const isDisclaimerShown = localStorage.getItem(IS_DISCLAIMER_SHOWN_KEY);
    console.log({ isDisclaimerShown });
    if (!isDisclaimerShown) setIsModalActive(true);
  }, []);

  const handleAcceptClick = () => {
    setIsModalActive(false);
    localStorage.setItem(IS_DISCLAIMER_SHOWN_KEY, "nQTR3VjtB2KS6EwXVctapnNE");
  };

  if (isModalActive)
    return (
      <div className="text-gray-300 fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
        <div className="bg-gray-700 max-w-2xl mx-auto p-7 rounded shadow-2xl shadow-gray-800">
          <h1 className="text-3xl md:text-5xl my-4">Terms and Conditions</h1>
          <p className="max-h-[70vh] overflow-y-auto">
            Terms and Conditions in short. Terms and Conditions in short. Terms
            and Conditions in short. Terms and Conditions in short. Terms and
            Conditions in short. Terms and Conditions in short. Terms and
            Conditions in short. Terms and Conditions in short. Terms and
            Conditions in short. Terms and Conditions in short.{" "}
            <Link href={"#"} passHref>
              <a className="text-blue-500">
                Detailed Terms and Conditions Page (Link to a PDF maybe)
              </a>
            </Link>
          </p>
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
