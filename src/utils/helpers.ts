import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const APP_SECRET = process.env.APP_SECRET;

export const GenerateToken = async (payload: any) => {
  return jwt.sign(payload, APP_SECRET!, { expiresIn: "1d" });
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

export const isValidEmail = async (email: any) => {
  // Basic email format validation using a regular expression
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
};

export const isValidDate = async (date: any) => {
  // Basic date format validation (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

export const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getNextFriday = (date: Date) => {
  const dayOfWeek = date.getDay();
  let daysUntilFriday = 5 - dayOfWeek;

  if (daysUntilFriday <= 0) {
    daysUntilFriday += 7;
  }

  const nextFriday = new Date(date);
  nextFriday.setDate(date.getDate() + daysUntilFriday);

  return nextFriday;
};
