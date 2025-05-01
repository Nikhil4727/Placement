// // authMiddleware.js
// import jwt from 'jsonwebtoken';

// const auth = (req, res, next) => {
//   const token = req.header('Authorization');

//   if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid Token' });
//   }
// };

// export default auth;


import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};

export default authenticateToken;
