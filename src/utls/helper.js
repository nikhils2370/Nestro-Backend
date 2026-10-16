import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateToken = (id) => {
  return jwt.sign(
    {
      exp: 30 * 24 * 60 * 60 * 1000,
      _id: id,
    },
    process.env.SECRET_KEY,
  );
};


export {generateToken}