import jwt from 'jsonwebtoken';

export const authCheck = (req, res, next) => {
  const token = req.cookies?.JwtToken;

  if (!token) {
    console.log('No token found in cookies');
    console.log('Cookies received:', req.cookies);
    return res.status(401).json({ message: 'User not authenticated!' });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decode.userId;
    console.log('Token verified for user:', req.userId);
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid Token' });
  }
};