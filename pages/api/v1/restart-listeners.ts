import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  async (req, res) => {
    await axios
      .get(`https://dev.listener.hydromint.xyz/restart`)
      .then((res) => res.data)
      .then((data) => {
        return res.json(data);
      })
      .catch((err) => {
        return res.json({ err });
      });
  }
);
