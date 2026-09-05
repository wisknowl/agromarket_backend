"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.createUser = exports.findUserByEmail = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const findUserByEmail = async (email) => {
    return prisma.user.findUnique({ where: { email } });
};
exports.findUserByEmail = findUserByEmail;
const createUser = async (name, email, phone, password, role = client_1.UserRole.BUYER) => {
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    return prisma.user.create({
        data: {
            name,
            email,
            phone,
            passwordHash: hashedPassword,
            role,
        },
    });
};
exports.createUser = createUser;
const validatePassword = async (user, password) => {
    return bcryptjs_1.default.compare(password, user.passwordHash);
};
exports.validatePassword = validatePassword;
