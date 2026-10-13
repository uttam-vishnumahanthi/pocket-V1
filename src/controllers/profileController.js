const profileService = require('../services/profileService');

class ProfileController {
  getProfile(req, res, next) {
    try {
      const profile = profileService.getProfile();
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  updateProfile(req, res, next) {
    try {
      const { username } = req.body;
      if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }
      const updated = profileService.updateProfile(username.trim());
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();
