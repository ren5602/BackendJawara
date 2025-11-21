export const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Check if user exists (from authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user role from user object
      const userRole = req.user.role;

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: error.message
      });
    }
  };
};
