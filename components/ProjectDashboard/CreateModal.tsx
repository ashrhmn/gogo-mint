import React, { useRef, useState } from "react";
import { INftMetadata } from "../../types";
import { v4 as uuidv4, v4 } from "uuid";
import { service } from "../../service";
import { uploadFileToFirebase } from "../../lib/firebase";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

const CreateModal = ({
  projectId,
  isCreateModalOpen,
  setIsCreateModalOpen,
  collectionType,
}: {
  projectId: number;
  ownerAddress: string | null;
  setIsCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCreateModalOpen: boolean;
  collectionType: string | null;
}) => {
  const router = useRouter();
  const [configSet, setConfigSet] = useState<INftMetadata>({
    file: null,
    name: "",
    openSeaBgColor: "",
    openSeaExternalUrl: "",
    traits: [{ trait_type: "", value: "", uuid: v4() }],
    description: "",
  });
  const [imageBase64, setImageBase64] = useState("");
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const onSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", (ev) => {
      if (ev.target && typeof ev.target.result === "string")
        setImageBase64(ev.target.result);
    });
    reader.readAsDataURL(file);
    setConfigSet((c) => ({ ...c, file }));
  };
  const handleAddNft = async () => {
    try {
      const [url] = await Promise.all([
        !configSet.file
          ? null
          : toast.promise(uploadFileToFirebase(configSet.file), {
              error: "Image uploading error",
              loading: "Uploading image",
              success: "Image uploaded successfully",
            }),
      ]);

      const { data: nft } = await toast.promise(
        service.post(`nft`, {
          projectId,
          name: configSet.name,
          description: configSet.description,
          properties: configSet.traits.map((t) => ({
            type: t.trait_type,
            value: t.value,
          })),
          backgroundColor: configSet.openSeaBgColor,
          externalUrl: configSet.openSeaExternalUrl,
          imageUrl: url,
          tokenId: collectionType === "1155" ? 0 : undefined,
        }),
        {
          error: "Error saving NFT",
          loading: "Saving NFT data",
          success: "NFT saved successfully",
        }
      );

      if (!nft.error) router.reload();
      // if (typeof nft.error == "string") toast.error(nft.error);
    } catch (error) {
      if (typeof error === "string") toast.error(error);
      // if (typeof (error as any).message == "string")
      //   toast.error((error as any).message);
      console.log(error);
    }
  };
  return (
    <div
      className={`fixed inset-0 sm:left-auto shadow-xl bg-gray-800 transition-transform duration-300 p-6 overflow-y-auto sm:min-w-[500px] ${
        isCreateModalOpen ? "z-50" : "translate-x-full"
      }`}
    >
      <div
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => setIsCreateModalOpen(false)}
      >
        <CloseIcon className="h-8 w-8" />
      </div>
      <h1 className="text-2xl">Create New NFT</h1>
      <h2 className="text-xl">Metadata</h2>
      <div className="mt-4 space-y-2">
        <label className="font-bold">
          Name <span className="text-red-700">*</span>
        </label>

        <input
          className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
          type="text"
          value={configSet.name}
          onChange={(e) =>
            setConfigSet((c) => ({ ...c, name: e.target.value }))
          }
        />
      </div>
      <div className="mt-4">
        <div
          onClick={() => {
            if (imgInputRef && imgInputRef.current) imgInputRef.current.click();
          }}
          className="relative aspect-square sm:w-40 flex justify-center items-center bg-gray-700 rounded cursor-pointer"
        >
          <input
            ref={imgInputRef}
            onChange={onSelectImage}
            type="file"
            hidden
          />
          {!!imageBase64 ? (
            <Image src={imageBase64} alt="" layout="fill" />
          ) : (
            <span className="text-2xl">+</span>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="font-bold">Description</label>
        <textarea
          className="w-full rounded bg-gray-700 h-28 p-3 focus:bg-gray-800 transition-colors"
          value={configSet.description}
          onChange={(e) =>
            setConfigSet((c) => ({ ...c, description: e.target.value }))
          }
        ></textarea>
      </div>
      <div className="mt-4 space-y-2">
        <label className="font-bold">Properties</label>
        <div>
          {configSet.traits.map((trait) => (
            <div key={trait.uuid} className="flex gap-1 items-center">
              <input
                placeholder="type"
                className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                type="text"
                value={trait.trait_type}
                onChange={(e) => {
                  setConfigSet((c) => ({
                    ...c,
                    traits: [
                      ...c.traits.map((t) =>
                        t.uuid === trait.uuid
                          ? { ...t, trait_type: e.target.value }
                          : t
                      ),
                    ],
                  }));
                }}
              />
              <input
                className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                type="text"
                placeholder="value"
                value={trait.value}
                onChange={(e) => {
                  setConfigSet((c) => ({
                    ...c,
                    traits: [
                      ...c.traits.map((t) =>
                        t.uuid === trait.uuid
                          ? { ...t, value: e.target.value }
                          : t
                      ),
                    ],
                  }));
                }}
              />
              <div
                className="cursor-pointer"
                onClick={() =>
                  setConfigSet((c) => ({
                    ...c,
                    traits: [...c.traits.filter((t) => t.uuid !== trait.uuid)],
                  }))
                }
              >
                <CloseIcon className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>
        <button
          className="bg-purple-800 text-white p-2 rounded hover:bg-purple-700 transition-colors w-32"
          onClick={() =>
            setConfigSet((c) => ({
              ...c,
              traits: [
                ...c.traits,
                { trait_type: "", value: "", uuid: uuidv4() },
              ],
            }))
          }
        >
          Add Row
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <label className="font-bold">Background Color</label>
        <input
          className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
          type="text"
          value={configSet.openSeaBgColor}
          onChange={(e) =>
            setConfigSet((c) => ({ ...c, openSeaBgColor: e.target.value }))
          }
        />
      </div>
      <div className="mt-4 space-y-2">
        <label className="font-bold">External URL</label>
        <input
          className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
          type="text"
          value={configSet.openSeaExternalUrl}
          onChange={(e) =>
            setConfigSet((c) => ({
              ...c,
              openSeaExternalUrl: e.target.value,
            }))
          }
        />
      </div>
      <div className="flex justify-end gap-4 my-4">
        <button className="border-2 border-gray-400 rounded p-2 w-32 hover:bg-gray-600">
          Cancel
        </button>
        <button
          onClick={handleAddNft}
          className="rounded p-2 w-32 bg-sky-800 text-white hover:bg-sky-700 transition-colors"
        >
          Create NFT
        </button>
      </div>
    </div>
  );
};

export default CreateModal;

const CloseIcon = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
