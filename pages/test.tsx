import React from "react";

const Test = () => {
  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          console.log(e.target.files);
          if (!e.target.files) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            if (!e.target || typeof e.target?.result !== "string") return;
            console.log(e.target.result);
            try {
              const json = JSON.parse(e.target.result);
              console.log(json);
            } catch (error) {
              console.log("Error parsing json : ", error);
            }
          };
          reader.readAsText(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <iframe
        src="https://gateway.ipfscdn.io/ipfs/QmUfp6thZQTmNKS6tzijJpxdoBe9X7spHwzRjUh3RPTAwF/nft-drop.html?contract=0xdc7DE179CEfE1f1ad065D7E32a36a9789daadDcf&chainId=4"
        width="600px"
        height="600px"
        style={{ maxWidth: "100%" }}
        frameBorder="0"
      ></iframe>
    </div>
  );
};

export default Test;
