import { NextApiRequest, NextApiResponse } from "next";
import { get721ContractCode } from "../services/contract.service";
import { getAbiEvmCodeFromSolidity } from "../services/solidity.service";
import { errorResponse, successResponse } from "../utils/Response.utils";
import { normalizeString } from "../utils/String.utils";

export const get721CompiledContract = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const contractName = req.query.name;
    const name =
      contractName && typeof contractName == "string"
        ? contractName
        : "Collection721";
    //   console.log("name : ", name);
    //   console.log("nzd name : ", normalizeString(name));
    const code = get721ContractCode(name);
    // console.log("Code : ", code);

    const initCode = getAbiEvmCodeFromSolidity(normalizeString(name), code);
    if (!initCode) return res.json(errorResponse("Error compiling"));
    return res.json(successResponse(initCode));
  } catch (error) {
    console.log(error);
    return res.status(500).json(errorResponse("Error compiling"));
  }
};
