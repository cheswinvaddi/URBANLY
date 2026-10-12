import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createInterface, emitKeypressEvents } from "node:readline";

if (process.env.NODE_ENV !== "development") {
  console.error(
    "Password reset is available only when NODE_ENV=development.",
  );
  process.exit(1);
}

nextEnv.loadEnvConfig(process.cwd(), true);

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is missing from the local environment.");
  process.exit(1);
}

if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
  console.error("MONGODB_URI is not a valid MongoDB connection URI.");
  process.exit(1);
}

function ask(question) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    prompt.question(question, (answer) => {
      prompt.close();
      resolve(answer);
    });
  });
}

function askForHiddenPassword(promptText) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return Promise.reject(
      new Error("Run this script in an interactive terminal to enter passwords safely."),
    );
  }

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdout.write(promptText);

  return new Promise((resolve, reject) => {
    let password = "";

    const cleanup = () => {
      process.stdin.removeListener("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdout.write("\n");
    };

    const onKeypress = (character, key) => {
      if (key?.ctrl && key.name === "c") {
        cleanup();
        password = "";
        reject(new Error("Password reset cancelled."));
        return;
      }

      if (key?.name === "return" || key?.name === "enter") {
        cleanup();
        resolve(password);
        return;
      }

      if (key?.name === "backspace" || key?.name === "delete") {
        password = Array.from(password).slice(0, -1).join("");
        return;
      }

      if (!key?.ctrl && !key?.meta && character) {
        password += character;
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Run this script in an interactive terminal.");
  }

  const email = (await ask("Account email: ")).trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid account email address.");
  }

  const password = await askForHiddenPassword("New password (input hidden): ");
  const confirmation = await askForHiddenPassword("Confirm new password: ");

  if (password.length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Password must be no more than 72 UTF-8 bytes.");
  }

  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });

    const users = mongoose.connection.collection("users");
    const user = await users.findOne(
      { email },
      { projection: { _id: 1 } },
    );

    if (!user) {
      throw new Error("No existing account was found for that email.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash } },
    );

    if (result.matchedCount !== 1 || result.modifiedCount !== 1) {
      throw new Error("The password update did not complete.");
    }

    console.log("Password updated for the existing account.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(() => {
  console.error(
    "Password reset failed. Check the account email, local MongoDB configuration, and database availability.",
  );
  process.exitCode = 1;
});
