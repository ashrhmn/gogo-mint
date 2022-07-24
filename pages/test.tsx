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
    </div>
  );
};

export default Test;
