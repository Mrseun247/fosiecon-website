const mongoose = require('mongoose');

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// The directory of Nigeria's 36 State Independent Electoral Commissions
// (SIECs) that FOSIECON is a forum/umbrella body for. This replaces
// KOSIEC's LGA model — FOSIECON doesn't run elections itself, it
// coordinates the state commissions that do.
const MemberCommissionSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: NIGERIAN_STATES,
      required: [true, 'State is required'],
      unique: true,
    },
    commissionName: {
      type: String,
      required: [true, 'Commission name is required'],
      trim: true,
      // e.g. "Kogi State Independent Electoral Commission"
    },
    abbreviation: {
      type: String,
      trim: true,
      uppercase: true,
      // e.g. "KOSIEC", "LASIEC"
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    chairmanName: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String, // Cloudinary secure URL
      default: null,
    },
    logoPublicId: {
      type: String,
      default: null,
    },
    dateJoinedForum: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from state name
MemberCommissionSchema.pre('save', function (next) {
  if (this.isModified('state')) {
    this.slug = this.state.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  next();
});

MemberCommissionSchema.statics.NIGERIAN_STATES = NIGERIAN_STATES;

module.exports = mongoose.model('MemberCommission', MemberCommissionSchema);
