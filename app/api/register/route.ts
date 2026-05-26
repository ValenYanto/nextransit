import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    message: "Data tidak valid",
                    errors: parsed.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { name, email, password } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    message: "Email sudah terdaftar",
                },
                { status: 409 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(
            {
                message: "Akun berhasil dibuat",
                user,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("[REGISTER_ERROR]", error);

        return NextResponse.json(
            {
                message: "Terjadi kesalahan server",
            },
            { status: 500 },
        );
    }
}