// ===================================================
// models/Event.js — Events & Forum Calendar
// ===================================================
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: { type: String },
    category: {
      type: String,
      enum: [
        'general_assembly',
        'election_observation',
        'training',
        'advocacy',
        'meeting',
        'conference',
        'other',
      ],
      default: 'other',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: { type: Date },
    time: { type: String }, // e.g. "9:00 AM - 4:00 PM"
    venue: { type: String },
    memberCommissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MemberCommission' }],
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

EventSchema.index({ eventDate: 1, status: 1 });

const Event = mongoose.model('Event', EventSchema);

// ===================================================
// models/Download.js — Downloadable Documents
// ===================================================
const DownloadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: { type: String },
    category: {
      type: String,
      enum: [
        'communique',
        'constitution',
        'guideline',
        'report',
        'policy',
        'notice',
        'other',
      ],
      default: 'other',
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    filePublicId: {
      type: String, // Cloudinary public_id
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'xlsx', 'image'],
      default: 'pdf',
    },
    fileSize: { type: String }, // e.g. "2.4 MB"
    downloadCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Download = mongoose.model('Download', DownloadSchema);

// ===================================================
// models/GalleryItem.js — Photo & Video Gallery
// ===================================================
const GalleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    mediaType: {
      type: String,
      enum: ['photo', 'video'],
      default: 'photo',
    },
    filePath: { type: String }, // Cloudinary secure URL
    filePublicId: { type: String }, // Cloudinary public_id
    videoUrl: { type: String }, // For videos: YouTube/Vimeo URL
    thumbnailPath: { type: String },
    category: {
      type: String,
      enum: [
        'general_assembly',
        'election_observation',
        'training',
        'advocacy',
        'meeting',
        'office',
        'other',
      ],
      default: 'other',
    },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 99 },
    takenAt: { type: Date },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

GalleryItemSchema.index({ isFeatured: 1, displayOrder: 1 });

const GalleryItem = mongoose.model('GalleryItem', GalleryItemSchema);

// ===================================================
// models/Inquiry.js — Contact Form Submissions
// ===================================================
const InquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    memberCommission: { type: mongoose.Schema.Types.ObjectId, ref: 'MemberCommission' },
    subject: {
      type: String,
      enum: [
        'general',
        'membership_inquiry',
        'election_observation',
        'partnership',
        'media_press',
        'complaint',
        'other',
      ],
      default: 'general',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [2000],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'closed'],
      default: 'new',
    },
    // Mail-style archive: independent of status. Archiving just moves an
    // inquiry out of the Inbox view — it doesn't mean it's been read,
    // replied to, or closed, and it can always be moved back.
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    adminNotes: { type: String }, // Internal notes
    repliedAt: { type: Date },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ isArchived: 1, createdAt: -1 });

const Inquiry = mongoose.model('Inquiry', InquirySchema);

// ===================================================
// models/Testimonial.js — Public Testimonials
// ===================================================
const TestimonialSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    authorTitle: { type: String, trim: true }, // e.g. "Chairman, LASIEC"
    authorPhoto: { type: String },
    content: {
      type: String,
      required: [true, 'Testimonial content is required'],
      maxlength: [600],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    memberCommission: { type: mongoose.Schema.Types.ObjectId, ref: 'MemberCommission' },
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 99 },
    submittedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

TestimonialSchema.index({ isApproved: 1, isFeatured: 1 });

const Testimonial = mongoose.model('Testimonial', TestimonialSchema);

// ===================================================
// models/Faq.js — Frequently Asked Questions
// ===================================================
const FaqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
    },
    category: {
      type: String,
      enum: ['general', 'membership', 'elections', 'forum_operations', 'other'],
      default: 'general',
    },
    displayOrder: { type: Number, default: 99 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FaqSchema.index({ isPublished: 1, displayOrder: 1 });

const Faq = mongoose.model('Faq', FaqSchema);

// ===================================================
// models/Setting.js — Site-Wide Settings
// ===================================================
const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Examples: 'ticker_messages', 'chairman_message', 'site_maintenance', 'contact_info'
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Can be string, array, object
      required: true,
    },
    description: { type: String },
    isPublic: { type: Boolean, default: true }, // Public settings served to frontend
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', SettingSchema);

module.exports = { Event, Download, GalleryItem, Inquiry, Testimonial, Faq, Setting };
