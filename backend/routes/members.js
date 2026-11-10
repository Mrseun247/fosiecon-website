const express = require('express');
const router = express.Router();
const MemberCommission = require('../models/MemberCommission');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/members
// @desc    Get all active member-state commissions
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const members = await MemberCommission.find({ isActive: true }).sort('state');
    res.json({ success: true, count: members.length, data: members });
  } catch (err) { next(err); }
});

// @route   GET /api/members/states
// @desc    Get the full list of 36 Nigerian states (for admin forms)
// @access  Public
router.get('/states', (req, res) => {
  res.json({ success: true, data: MemberCommission.NIGERIAN_STATES });
});

// @route   GET /api/members/:id
// @desc    Get single member commission
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const member = await MemberCommission.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member commission not found.' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

// @route   POST /api/members
// @desc    Add a member-state commission (with optional logo upload)
// @access  Private (super_admin, admin)
router.post(
  '/',
  protect,
  authorize('super_admin', 'admin'),
  upload.single('memberLogo'),
  async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.logo = req.file.path;
        data.logoPublicId = req.file.filename;
      }
      const member = await MemberCommission.create(data);
      res.status(201).json({ success: true, data: member });
    } catch (err) { next(err); }
  }
);

// @route   PUT /api/members/:id
// @desc    Update a member commission (supports logo replacement)
// @access  Private (super_admin, admin)
router.put(
  '/:id',
  protect,
  authorize('super_admin', 'admin'),
  upload.single('memberLogo'),
  async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.logo = req.file.path;
        data.logoPublicId = req.file.filename;
      }
      const member = await MemberCommission.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
      if (!member) return res.status(404).json({ success: false, message: 'Member commission not found.' });
      res.json({ success: true, data: member });
    } catch (err) { next(err); }
  }
);

// @route   DELETE /api/members/:id
// @desc    Soft-delete member commission (deactivate)
// @access  Private (super_admin)
router.delete('/:id', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const member = await MemberCommission.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member commission not found.' });
    res.json({ success: true, message: 'Member commission deactivated.' });
  } catch (err) { next(err); }
});

module.exports = router;
