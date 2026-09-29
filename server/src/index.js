import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { prisma } from "./db.js";
import { requireAdmin } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 5000;
const allowed = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    console.warn(
        "WARNING: Set JWT_SECRET to a random value of at least 32 characters.",
    );

app.set("trust proxy", 1);
app.use(helmet());
app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || allowed.includes(origin)) return cb(null, true);
            cb(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
    }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("API is running successfully!");
});

app.get("/health", (req, res) =>
    res.json({ ok: true, service: "svsvdac-temple-api" }),
);

app.get("/api/poojas", async(req, res, next) => {
    try {
        const poojas = await prisma.pooja.findMany({
            where: { active: true },
            orderBy: { name: "asc" },
        });
        res.json({ poojas });
    } catch (e) {
        next(e);
    }
});

app.post(
    "/api/bookings",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: "draft-7",
        legacyHeaders: false,
    }),
    async(req, res, next) => {
        try {
            const b = req.body || {};
            const required = [
                "poojaId",
                "devoteeName",
                "gotram",
                "phone",
                "address",
                "city",
                "state",
                "date",
                "timeSlot",
            ];
            for (const k of required)
                if (b[k] === undefined || String(b[k]).trim() === "")
                    return res.status(400).json({ message: `${k} is required` });
            const phone = String(b.phone).replace(/\D/g, "");
            if (phone.length < 10 || phone.length > 15)
                return res.status(400).json({ message: "Enter a valid mobile number" });
            const pooja = await prisma.pooja.findFirst({
                where: { id: Number(b.poojaId), active: true },
            });
            if (!pooja)
                return res
                    .status(404)
                    .json({ message: "Selected pooja is unavailable" });
            const date = new Date(`${b.date}T00:00:00.000Z`);
            if (
                Number.isNaN(date.getTime()) ||
                date.toISOString().slice(0, 10) !== String(b.date).slice(0, 10)
            )
                return res.status(400).json({ message: "Enter a valid pooja date" });
            if (
                date <
                new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")
            )
                return res
                    .status(400)
                    .json({ message: "Pooja date cannot be in the past" });
            const names = Array.isArray(b.familyMembers) ?
                b.familyMembers
                .map((x) => String(x).trim())
                .filter(Boolean)
                .slice(0, 30) : [];
            const bookingNo = `SVS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            const booking = await prisma.booking.create({
                data: {
                    bookingNo,
                    poojaId: pooja.id,
                    devoteeName: String(b.devoteeName).trim().slice(0, 160),
                    gotram: String(b.gotram).trim().slice(0, 120),
                    phone,
                    email: b.email ? String(b.email).trim().slice(0, 190) : null,
                    address: String(b.address).trim(),
                    city: String(b.city).trim().slice(0, 100),
                    state: String(b.state).trim().slice(0, 100),
                    pincode: b.pincode ? String(b.pincode).slice(0, 12) : null,
                    date,
                    timeSlot: String(b.timeSlot).slice(0, 30),
                    instructions: b.instructions ?
                        String(b.instructions).slice(0, 2000) : null,
                    amount: pooja.price,
                    familyMembers: {
                        create: names.map((name) => ({ name: name.slice(0, 160) })),
                    },
                },
                include: { pooja: true },
            });
            res.status(201).json({
                booking: {
                    id: booking.id,
                    bookingNo: booking.bookingNo,
                    poojaName: booking.pooja.name,
                    amount: Number(booking.amount),
                    status: booking.status,
                    date: booking.date,
                    timeSlot: booking.timeSlot,
                },
            });
        } catch (e) {
            next(e);
        }
    },
);

app.get("/api/bookings/lookup", async(req, res, next) => {
    try {
        const phone = String(req.query.phone || "").replace(/\D/g, "");
        const bookingNo = String(req.query.bookingNo || "").trim();
        if (phone.length < 10)
            return res
                .status(400)
                .json({ message: "Enter the registered mobile number" });
        const bookings = await prisma.booking.findMany({
            where: { phone, ...(bookingNo ? { bookingNo } : {}) },
            include: { pooja: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 30,
        });
        res.json({
            bookings: bookings.map((b) => ({
                id: b.id,
                bookingNo: b.bookingNo,
                poojaName: b.pooja.name,
                date: b.date,
                timeSlot: b.timeSlot,
                amount: Number(b.amount),
                status: b.status,
            })),
        });
    } catch (e) {
        next(e);
    }
});

app.post(
    "/api/admin/login",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 8,
        standardHeaders: "draft-7",
        legacyHeaders: false,
    }),
    async(req, res, next) => {
        try {
            const email = String((req.body && req.body.email) || "")
                .toLowerCase()
                .trim();
            const password = String((req.body && req.body.password) || "");
            const admin = await prisma.admin.findUnique({ where: { email } });
            if (!admin || !(await bcrypt.compare(password, admin.passwordHash)))
                return res.status(401).json({ message: "Invalid email or password" });
            const token = jwt.sign({ id: admin.id, email: admin.email },
                process.env.JWT_SECRET, { expiresIn: "8h" },
            );
            res.cookie("svs_admin", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 8 * 60 * 60 * 1000,
                path: "/",
            });
            res.json({ ok: true });
        } catch (e) {
            next(e);
        }
    },
);

app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("svs_admin", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    });
    res.json({ ok: true });
});

app.get("/api/admin/bookings", requireAdmin, async(req, res, next) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: { pooja: { select: { name: true } }, familyMembers: true },
            orderBy: { createdAt: "desc" },
            take: 500,
        });
        res.json({
            bookings: bookings.map((b) => ({
                ...b,
                poojaName: b.pooja.name,
                amount: Number(b.amount),
                familyMembers: b.familyMembers.map((f) => f.name),
            })),
        });
    } catch (e) {
        next(e);
    }
});

app.patch("/api/admin/bookings/:id", requireAdmin, async(req, res, next) => {
    try {
        const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
        if (!allowed.includes(req.body && req.body.status))
            return res.status(400).json({ message: "Invalid booking status" });
        const booking = await prisma.booking.update({
            where: { id: Number(req.params.id) },
            data: { status: req.body.status },
        });
        res.json({ booking: { id: booking.id, status: booking.status } });
    } catch (e) {
        next(e);
    }
});

app.get("/api/admin/poojas", requireAdmin, async(req, res, next) => {
    try {
        const poojas = await prisma.pooja.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json({ poojas });
    } catch (e) {
        next(e);
    }
});

app.post("/api/admin/poojas", requireAdmin, async(req, res, next) => {
    try {
        const { name, description = "", price } = req.body || {};
        if (!String(name || "").trim() ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        )
            return res
                .status(400)
                .json({ message: "Valid name and price are required" });
        const pooja = await prisma.pooja.create({
            data: {
                name: String(name).trim().slice(0, 160),
                description: String(description).slice(0, 5000),
                price: Number(price),
            },
        });
        res.status(201).json({ pooja });
    } catch (e) {
        next(e);
    }
});

app.put("/api/admin/poojas/:id", requireAdmin, async(req, res, next) => {
    try {
        const { name, description = "", price, active } = req.body || {};
        if (!String(name || "").trim() ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        )
            return res
                .status(400)
                .json({ message: "Valid name and price are required" });
        const pooja = await prisma.pooja.update({
            where: { id: Number(req.params.id) },
            data: {
                name: String(name).trim().slice(0, 160),
                description: String(description).slice(0, 5000),
                price: Number(price),
                ...(typeof active === "boolean" ? { active } : {}),
            },
        });
        res.json({ pooja });
    } catch (e) {
        next(e);
    }
});

app.delete("/api/admin/poojas/:id", requireAdmin, async(req, res, next) => {
    try {
        await prisma.pooja.update({
            where: { id: Number(req.params.id) },
            data: { active: false },
        });
        res.json({ ok: true });
    } catch (e) {
        next(e);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    if (err.code === "P2002")
        return res
            .status(409)
            .json({ message: "A record with these details already exists" });
    if (err.code === "P2025")
        return res.status(404).json({ message: "Record not found" });
    res.status(500).json({
        message: process.env.NODE_ENV === "production" ?
            "Server error. Please try again." : err.message || "Server error",
    });
});

app.listen(PORT, () => console.log(`SVSVDAC API listening on ${PORT}`));