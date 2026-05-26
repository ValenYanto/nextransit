"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormValues = {
    name: string;
    email: string;
    password: string;
};

export function RegisterForm() {
    const router = useRouter();
    const [message, setMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<RegisterFormValues>();

    async function onSubmit(values: RegisterFormValues) {
        setMessage(null);

        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
            setMessage(data.message ?? "Gagal membuat akun.");
            return;
        }

        router.push("/login");
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {message ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                    {message}
                </div>
            ) : null}

            <div className="space-y-2">
                <Label>Name</Label>
                <Input
                    placeholder="Valen Yanto"
                    className="h-12 rounded-2xl"
                    {...register("name", { required: true })}
                />
            </div>

            <div className="space-y-2">
                <Label>Email</Label>
                <Input
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 rounded-2xl"
                    {...register("email", { required: true })}
                />
            </div>

            <div className="space-y-2">
                <Label>Password</Label>
                <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    className="h-12 rounded-2xl"
                    {...register("password", { required: true, minLength: 6 })}
                />
            </div>

            <Button disabled={isSubmitting} className="h-12 w-full rounded-2xl">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                    </>
                ) : (
                    "Create Account"
                )}
            </Button>
        </form>
    );
}