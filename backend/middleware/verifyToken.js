import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
	const token = req.cookies.token;
	if (!token)
		return res
			.status(401)
			.json({ success: false, message: 'Unauthorized request' });

	try {
		const decoded = jwt.verify(token, process.env.SECRET_KEY);
		if (!decoded)
			return res
				.status(401)
				.json({ success: false, message: 'Unauthorized request' });
		req.userId = decoded.userId;
		next();
	} catch (error) {
		console.log('error', error.message);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};
