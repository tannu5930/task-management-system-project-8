import jwt from 'jsonwebtoken';

const generateToken = (userId, res) => {
  console.log('Creating token for user:', userId);
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '6d' });

  console.log('Setting JWT cookie...');
  res.cookie('JwtToken', token, {
    httpOnly: true,
    maxAge: 6 * 24 * 60 * 60 * 1000,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  console.log('JWT cookie set successfully');
};

export default generateToken;