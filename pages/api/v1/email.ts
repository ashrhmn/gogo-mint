import type { NextApiRequest, NextApiResponse } from "next";
import { createTransport } from "nodemailer";

type Data = {
  msg: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST")
    return res.status(405).json({ msg: "Method not allowed" });
  try {
    const transport = createTransport({
      host: "smtp.sendgrid.net",
      port: 25,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    // const sendMail =
    await transport.sendMail({
      from: "hydromint@ashrhmn.com",
      to: "ashrhmn@outlook.com",
      // to: "hydromint.xyz@domainsbyproxy.com",
      subject: `${req.body.email} - from hydromint.xyz`,
      html: `
      ${req.body.email} has contacted through https://hydromint.xyz/
      `,
    });
    // console.log({ sendMail });

    return res.status(200).json({ msg: "sent" });
  } catch (error: any) {
    return res.status(500).json({ msg: error });
  }
}
