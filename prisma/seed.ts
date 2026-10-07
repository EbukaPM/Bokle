import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLATFORM_SYSTEM_EMAIL } from "../lib/wallet";

const prisma = new PrismaClient();

const GENERAL_CATEGORIES = [
  {
    name: "House Cleaning",
    description: "Domestic cleaning services",
    iconName: "sparkles",
    checklistTemplate: { items: ["Areas cleaned", "Supplies used", "Condition before/after"] },
  },
  {
    name: "Laundry",
    description: "Washing, drying, ironing",
    iconName: "shirt",
    checklistTemplate: { items: ["Items received", "Items returned", "Condition notes"] },
  },
  {
    name: "Cooking / Meal Prep",
    description: "Meal preparation and cooking",
    iconName: "utensils",
    checklistTemplate: { items: ["Meals prepared", "Ingredients used", "Hygiene notes"] },
  },
  {
    name: "General Home Maintenance",
    description: "Minor home maintenance tasks",
    iconName: "wrench",
    checklistTemplate: { items: ["Task completed", "Materials used", "Before/after photos"] },
  },
  {
    name: "Elderly Care Visit",
    description: "Non-clinical elderly care and companionship",
    iconName: "heart-handshake",
    checklistTemplate: { items: ["Contact made", "Wellbeing observed", "Concerns flagged"] },
  },
  {
    name: "Non-Clinical Health Support",
    description: "Basic, non-medical health support",
    iconName: "stethoscope",
    checklistTemplate: { items: ["Support provided", "Observations", "Concerns flagged"] },
  },
  {
    name: "Companionship Visit",
    description: "Social companionship visits",
    iconName: "users",
    checklistTemplate: { items: ["Visit duration", "Activities", "Mood observed"] },
  },
  {
    name: "Child Supervision",
    description: "Supervision and school run support",
    iconName: "baby",
    checklistTemplate: { items: ["Child picked up/dropped", "Safety confirmed", "Notes"] },
  },
  {
    name: "Errand Running",
    description: "General errands",
    iconName: "footprints",
    checklistTemplate: { items: ["Errand completed", "Receipts", "Notes"] },
  },
  {
    name: "Shopping / Market Run",
    description: "Shopping on client's behalf",
    iconName: "shopping-cart",
    checklistTemplate: { items: ["Items purchased", "Total spent", "Receipt photo"] },
  },
  {
    name: "Delivery (local)",
    description: "Local delivery of items",
    iconName: "package",
    checklistTemplate: { items: ["Item picked up", "Item delivered", "Recipient confirmed"] },
  },
  {
    name: "Queue / Office Run",
    description: "Standing in queues / office errands",
    iconName: "building",
    checklistTemplate: { items: ["Task completed", "Documents obtained", "Notes"] },
  },
  {
    name: "Other",
    description: "Custom general service",
    iconName: "more-horizontal",
    checklistTemplate: { items: ["Task description", "Completion notes"] },
  },
];

const CHECK_AM_CATEGORIES = [
  {
    name: "Vehicle Check",
    description: "Car, motorcycle, or other vehicle being considered for purchase",
    iconName: "car",
    baseFee: 7500,
    proximityRadiusKm: 15,
    minPhotosRequired: 6,
    checklistTemplate: {
      items: [
        "Make, model, year, colour (confirm against listing)",
        "Chassis/VIN number confirmed",
        "Engine condition (visual + start-up sound)",
        "Body condition (dents, rust, paint condition)",
        "Tyre condition (all 4 + spare)",
        "Interior condition (seats, dashboard, electronics)",
        "Lights (headlights, brake lights, indicators)",
        "Exhaust smoke assessment",
        "Odometer reading",
        "Documentation check (logbook, proof of ownership present)",
      ],
      overallAssessmentOptions: ["Recommended", "Not Recommended", "Needs Specialist Review"],
    },
  },
  {
    name: "Property Check",
    description: "House, apartment, land, or commercial property",
    iconName: "home",
    baseFee: 10000,
    proximityRadiusKm: 20,
    minPhotosRequired: 8,
    checklistTemplate: {
      items: [
        "Property type and structure confirmed",
        "Boundary / land markers visible and clear",
        "Structural condition of building (cracks, roofing, walls)",
        "Water and electricity supply confirmed",
        "Sanitation / drainage assessment",
        "Surrounding environment (neighbourhood description, security observation)",
        "Neighbouring structures / encroachments noted",
        "Documents present on site (C of O, survey plan, etc.) — noted if shown, not copied",
        "Access road condition",
      ],
    },
  },
  {
    name: "Welfare Check",
    description: "Elderly relative, family member, or any individual",
    iconName: "heart-pulse",
    baseFee: 5000,
    proximityRadiusKm: 15,
    minPhotosRequired: 3,
    checklistTemplate: {
      items: [
        "Contact made with individual (Yes/No)",
        "Individual appears well / any observable concern",
        "Living environment observed (clean, safe, adequate)",
        "Meals / food availability confirmed",
        "Medication observed (if applicable)",
        "Individual's stated mood or expressed needs",
        "Emergency concern flagged (Yes/No)",
      ],
      photoPolicy: "Environment only — no personal photos without consent",
    },
  },
  {
    name: "Child Check",
    description: "A child at school, with a relative, or at a stated location",
    iconName: "school",
    baseFee: 5000,
    proximityRadiusKm: 15,
    minPhotosRequired: 3,
    checklistTemplate: {
      items: [
        "Child located at stated address (Yes/No)",
        "Child appears safe and well",
        "Environment appropriate and safe",
        "Caregiver / supervising adult present and identified",
        "Child's stated wellbeing (age-appropriate)",
        "Any observed concern",
      ],
      photoPolicy: "Environment only — no photos of the child, ever",
    },
  },
  {
    name: "Business / Site Check",
    description: "Business premises, shop, investment site, or any commercial location",
    iconName: "store",
    baseFee: 7500,
    proximityRadiusKm: 20,
    minPhotosRequired: 5,
    checklistTemplate: {
      items: [
        "Business / site located at stated address (Yes/No)",
        "Business operational (open, active, trading)",
        "Physical size and condition of premises",
        "Staff or activity level observed",
        "Signage and branding match description",
        "Surrounding area and access",
      ],
    },
  },
  {
    name: "Custom Check",
    description: "Any other physical asset or location not listed above",
    iconName: "clipboard-list",
    baseFee: 5000,
    proximityRadiusKm: 20,
    minPhotosRequired: 3,
    checklistTemplate: { items: [], note: "Up to 10 client-defined questions auto-populate the report form" },
  },
];

const PLATFORM_SETTINGS: Array<{ key: string; value: string; description: string }> = [
  { key: "general_commission_rate", value: "0.15", description: "General marketplace commission (15%)" },
  { key: "min_booking_amount", value: "1000", description: "Minimum general marketplace booking amount (₦)" },
  { key: "check_am_commission_rate", value: "0.20", description: "Help Me Check Am commission (20%)" },
  { key: "escrow_auto_release_hours", value: "24", description: "Hours after completion before escrow auto-releases" },
  { key: "min_withdrawal_amount", value: "1000", description: "Minimum provider withdrawal amount (₦)" },
  { key: "withdrawal_fee", value: "50", description: "Flat withdrawal processing fee (₦)" },
  { key: "premium_price_monthly", value: "2500", description: "Premium plan — monthly price (₦)" },
  { key: "premium_price_quarterly", value: "6500", description: "Premium plan — quarterly price (₦)" },
  { key: "premium_price_annual", value: "24000", description: "Premium plan — annual price (₦)" },
  { key: "min_wallet_topup", value: "500", description: "Minimum wallet top-up amount (₦)" },
  { key: "report_deadline_options_hours", value: "12,24,48,72", description: "Check Am report deadline options" },
  { key: "max_provider_coverage_radius_km", value: "50", description: "Cap on provider-set coverage radius" },
];

async function main() {
  console.log("Seeding platform system user + wallet...");
  const platformUser = await prisma.user.upsert({
    where: { email: PLATFORM_SYSTEM_EMAIL },
    create: {
      fullName: "Bokle Platform",
      email: PLATFORM_SYSTEM_EMAIL,
      isAdmin: true,
      isSuperAdmin: true,
      isEmailVerified: true,
    },
    update: {},
  });
  await prisma.wallet.upsert({
    where: { userId: platformUser.id },
    create: { userId: platformUser.id },
    update: {},
  });

  console.log("Seeding super-admin account (admin@bokle.ng / Admin#12345)...");
  const adminPasswordHash = await bcrypt.hash("Admin#12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@bokle.ng" },
    create: {
      fullName: "Bokle Admin",
      email: "admin@bokle.ng",
      passwordHash: adminPasswordHash,
      isAdmin: true,
      isSuperAdmin: true,
      isEmailVerified: true,
      state: "Lagos",
      lga: "Ikeja",
    },
    update: {},
  });

  console.log("Seeding general marketplace categories...");
  for (const cat of GENERAL_CATEGORIES) {
    // General marketplace pricing is a floor, not a fixed catalogue price —
    // the client's final price is max(baseFee, admin min_booking_amount).
    // 1500 is just a sane starting estimate shown before booking.
    const withBaseFee = { baseFee: 1500, ...cat };
    await prisma.serviceCategory.upsert({
      where: { id: `general__${cat.name}` },
      create: { id: `general__${cat.name}`, type: "general", ...withBaseFee },
      update: withBaseFee,
    });
  }

  console.log("Seeding Help Me Check Am categories...");
  for (const cat of CHECK_AM_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { id: `check_am__${cat.name}` },
      create: { id: `check_am__${cat.name}`, type: "check_am", ...cat },
      update: { ...cat },
    });
  }

  console.log("Seeding platform settings...");
  for (const setting of PLATFORM_SETTINGS) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value, description: setting.description },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
