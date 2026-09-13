import dotenv from "dotenv";
import path from "path";
import bcryptjs from "bcryptjs";

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import connectDB from "../lib/mongodb";
import UserModel from "../models/User";

export async function seedAdmin() {
  try {
    await connectDB();
    const adminEmail = "admin@gmail.com";
    const adminPassword = "Admin@1234";

    const passwordHash = await bcryptjs.hash(adminPassword, 12);
    let existingAdmin = await UserModel.findOne({ email: adminEmail, role: "ADMIN" });

    if (!existingAdmin) {
      // Check if user exists by email under different role or without role constraint
      existingAdmin = await UserModel.findOne({ email: adminEmail });
    }

    if (existingAdmin) {
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = "ADMIN";
      if (!existingAdmin.name) existingAdmin.name = "System Admin";
      if (!existingAdmin.phone) existingAdmin.phone = "9876543210";
      await existingAdmin.save();
      console.log(`[Seed] Admin user updated: Email = ${adminEmail}, Password = ${adminPassword}`);
    } else {
      await UserModel.create({
        name: "System Admin",
        email: adminEmail,
        phone: "9876543210",
        passwordHash,
        role: "ADMIN",
      });
      console.log(`[Seed] Admin user created: Email = ${adminEmail}, Password = ${adminPassword}`);
    }
  } catch (err) {
    console.error("[Seed] Error seeding admin user:", err);
  }
}

if (require.main === module || process.argv[1]?.includes("seedAdmin")) {
  seedAdmin().then(() => {
    console.log("[Seed] Completed admin seed.");
    process.exit(0);
  });
}
