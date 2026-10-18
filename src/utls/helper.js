import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateToken = (id) => {
  return jwt.sign(
    {
      _id: id,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "30d",
    },
  );
};

export { generateToken };
