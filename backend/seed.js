require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const MemberCommission = require('./models/MemberCommission');
const TeamMember = require('./models/TeamMember');
const AdminLog = require('./models/AdminLog');
const { Setting, Faq } = require('./models/SharedModels');

// Kogi is seeded with its real, known commission details (KOSIEC, this
// project's sibling site). Every other state is seeded as a placeholder
// record — name and state only — for the admin to fill in via the CMS;
// fabricating chairman names, abbreviations, or contact details for
// commissions this project has no real data on would be worse than
// leaving them blank.
const MEMBER_COMMISSIONS = MemberCommission.NIGERIAN_STATES.map((state) =>
  state === 'Kogi'
    ? {
        state,
        commissionName: 'Kogi State Independent Electoral Commission',
        abbreviation: 'KOSIEC',
        chairmanName: 'Mamman Nda Eri',
        contactEmail: 'erimamman2@gmail.com',
        contactPhone: '09169490757',
        website: 'https://www.kosiec.org',
        isActive: true,
      }
    : {
        state,
        commissionName: `${state} State Independent Electoral Commission`,
        isActive: true,
      }
);

const INITIAL_SETTINGS = [
  {
    key: 'ticker_messages',
    value: [
      '📢 FOSIECON — Forum of State Independent Electoral Commissions of Nigeria',
      '🗳️ Bringing together all 36 State Independent Electoral Commissions under one umbrella',
      '📋 In line with the Constitution and the Electoral Act 2026',
      '📞 For inquiries: WhatsApp +234 916 949 0757',
    ],
    description: 'Scrolling ticker messages shown at the top of the website',
    isPublic: true,
  },
  {
    key: 'contact_info',
    value: {
      phone1: '2349169490757',
      phone2: '08035904252',
      email: 'info@fosieconng.org',
      secondaryEmail: 'erimamman2@gmail.com',
      address: 'No. 1 Ado Ibrahim Road, GRA, Lokoja, Kogi State, Nigeria',
      officeHours: 'Weekdays: 9:00am – 5:00pm',
      whatsapp: '2349169490757',
    },
    description: 'Forum contact details',
    isPublic: true,
  },
  {
    key: 'commission_stats',
    value: { memberStates: 36, yearEstablished: 2000, staffCount: 43 },
    description: 'Key statistics shown on homepage',
    isPublic: true,
  },
  {
    key: 'about_summary',
    value:
      'The Forum is meant to bring together under one umbrella the 36 State Independent Electoral ' +
      'Commissions for easy communication, planning on electoral processes in line with the ' +
      'Constitution and the Electoral Act 2026.',
    description: 'Short about text shown on homepage',
    isPublic: true,
  },
  {
    key: 'site_maintenance',
    value: false,
    description: 'Set to true to show maintenance page to public',
    isPublic: false,
  },
];

const INITIAL_FAQS = [
  {
    question: 'What is FOSIECON?',
    answer:
      'FOSIECON (Forum of State Independent Electoral Commissions of Nigeria) brings together all 36 ' +
      'State Independent Electoral Commissions under one umbrella for easy communication and planning ' +
      'on electoral processes, in line with the Constitution and the Electoral Act 2026.',
    category: 'general',
    displayOrder: 1,
  },
  {
    question: 'What does FOSIECON do?',
    answer:
      'FOSIECON supports individual State Electoral Commissions on issues relating to Local Government ' +
      'elections, shares best practices across the states, observes and monitors elections, and ' +
      'supports sister states during their election cycles.',
    category: 'general',
    displayOrder: 2,
  },
  {
    question: 'Who can join FOSIECON as a member?',
    answer:
      'Membership is open to the 36 State Independent Electoral Commissions of Nigeria. Contact us ' +
      'via the inquiry form for details on membership status and participation.',
    category: 'membership',
    displayOrder: 3,
  },
  {
    question: 'How can I reach FOSIECON?',
    answer:
      'You can reach us via WhatsApp, email, or the contact form on this site. Our office is open ' +
      'weekdays from 9:00am to 5:00pm.',
    category: 'general',
    displayOrder: 4,
  },
];

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Starting database seed...\n');

  try {
    // ── 1. Clear existing data ──────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      MemberCommission.deleteMany({}),
      TeamMember.deleteMany({}),
      Setting.deleteMany({}),
      Faq.deleteMany({}),
      AdminLog.deleteMany({}),
    ]);
    console.log('🗑️  Cleared: Users, MemberCommissions, TeamMembers, Settings, FAQs, AdminLogs');

    // ── 2. Seed the 36 member-state commissions ────────────
    const members = await MemberCommission.insertMany(MEMBER_COMMISSIONS);
    console.log(`✅ Seeded ${members.length} member-state commissions (Kogi/KOSIEC fully detailed; others as placeholders)`);

    // ── 3. Seed Super Admin ─────────────────────────────────
    const superAdmin = await User.create({
      fullName: 'FOSIECON Super Admin',
      email: 'admin@fosiecon.org.ng',
      password: 'Fosiecon@2026',
      role: 'super_admin',
      staffId: 'FOSIECON-SA-001',
    });
    console.log('✅ Super Admin created → admin@fosiecon.org.ng / Fosiecon@2026');

    // ── 4. Seed Chairman admin account ─────────────────────
    await User.create({
      fullName: 'Mamman Nda Eri',
      email: 'erimamman2@gmail.com',
      password: 'Fosiecon@Chairman2026',
      role: 'admin',
      staffId: 'FOSIECON-CHAIR-001',
      phone: '09169490757',
    });
    console.log('✅ Chairman admin account created → erimamman2@gmail.com');

    // ── 5. Seed Chairman TeamMember record ──────────────────
    await TeamMember.create({
      fullName: 'Mamman Nda Eri',
      title: 'Hon.',
      role: 'Chairman of the Forum',
      roleCategory: 'exco',
      representingState: 'Kogi',
      bio:
        'Hon. Mamman Nda Eri is the Chairman of the Forum of State Independent Electoral Commissions ' +
        'of Nigeria (FOSIECON), and Chairman of the Kogi State Independent Electoral Commission (KOSIEC). ' +
        'He coordinates the 36 State Independent Electoral Commissions on electoral processes in line ' +
        'with the Constitution and the Electoral Act 2026.',
      photo: null, // ← will be updated via PUT /api/team/:id/photo
      email: 'erimamman2@gmail.com',
      phone: '09169490757',
      displayOrder: 1,
      isChairman: true,
      isActive: true,
    });
    console.log('✅ Chairman TeamMember record seeded (photo: pending upload)');

    // ── 6. Seed Settings ─────────────────────────────────────
    await Setting.insertMany(
      INITIAL_SETTINGS.map((s) => ({ ...s, updatedBy: superAdmin._id }))
    );
    console.log('✅ Site settings seeded');

    // ── 7. Seed FAQs ─────────────────────────────────────────
    await Faq.insertMany(INITIAL_FAQS);
    console.log('✅ FAQs seeded');

    // ── 8. Log the seed action itself ────────────────────────
    await AdminLog.create({
      user: superAdmin._id,
      email: superAdmin.email,
      fullName: superAdmin.fullName,
      role: superAdmin.role,
      action: 'create',
      resource: 'Database',
      details: 'Initial database seed executed (member commissions, users, team, settings, FAQs).',
      success: true,
    });
    console.log('✅ Seed action recorded in AdminLog');

    console.log('\n🎉 Seed complete!\n');
    console.log('──────────────────────────────────────────────');
    console.log('  Super Admin   : admin@fosiecon.org.ng');
    console.log('  Password      : Fosiecon@2026');
    console.log('  Chairman Login: erimamman2@gmail.com');
    console.log('  Password      : Fosiecon@Chairman2026');
    console.log('  ⚠️  Change passwords immediately after first login!');
    console.log('──────────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
