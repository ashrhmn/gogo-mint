import { prisma } from "../lib/db";

// export const getAllCreators = async () => {
//   return await prisma.creatorDiscord.findMany();
// };

// export const isCreator = async (username: string, discriminator: number) => {
//   return (
//     (await prisma.creatorDiscord.count({
//       where: { username, discriminator },
//     })) > 0
//   );
// };
