import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model.js';
const verifyToken = async (req, res, next) => {
    try {
        let token = null;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            return res.status(400).json({
                success: true,
                massage: "token is required "
            })
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        // console.log(decoded);
        if (!decoded) {
            return res.status(400).json({
              success: true,
              massage: "token is required ",
            });
        }
        const user = await UserModel.findById({ _id: decoded._id }).select("-password");
        req.user = user
        next()
        
        
    }  catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed. Invalid or expired token."
        });
    }
}


const authorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. admin token required.",
      });
    }
    next();
  };
};



export { verifyToken, authorized };