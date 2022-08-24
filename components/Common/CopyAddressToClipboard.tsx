import { shortenIfAddress } from "@usedapp/core";
import React from "react";
import toast from "react-hot-toast";

const CopyAddressToClipboard = ({
  address,
  className = "",
  shorten = false,
}: {
  address: string;
  className?: string;
  shorten?: boolean;
}) => {
  const copyToClipBoard = () => {
    navigator.clipboard.writeText(address);
    toast.success("Copied!");
  };
  return (
    <div
      className={`inline-flex items-center group cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors p-1 rounded border-2 border-gray-500 select-none ${className} ${
        shorten ? "min-w-[210px] justify-center" : "min-w-[450px]"
      }`}
      onClick={copyToClipBoard}
    >
      <span>
        <CopyIcon />
      </span>
      <span>{shorten ? shortenIfAddress(address) : address}</span>
    </div>
  );
};

export default CopyAddressToClipboard;

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
    />
  </svg>
);
