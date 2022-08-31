import React, { useEffect, useState } from "react";

const useChainId = () => {
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  useEffect(() => {
    (async () => {
      const id = +(await (window as any).ethereum.request({
        method: "eth_chainId",
      }));
      setChainId(id);
    })();
    (window as any).ethereum.on("chainChanged", (id: number) => {
      console.log("Invoked");
      setChainId(id);
    });
    return () =>
      (window as any).ethereum.removeListener("chainChanged", (id: number) => {
        console.log("Invoked");
        setChainId(id);
      });
  }, []);
  return chainId;
};

export default useChainId;
