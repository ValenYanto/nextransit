"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormValues = {
    email: string;
    password: string;
};

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<LoginFormValues>({
        defaultValues: {
            email: "operator@nextransit.ai",
            password: "password123",
        },
    });

    async function onSubmit(values: LoginFormValues) {
        setError(null);

        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setError("Email atau password salah.");
            return;
        }

        router.push(callbackUrl);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                    {error}
                </div>
            ) : null}

            <div className="space-y-2">
                <Label>Email</Label>
                <Input
                    type="email"
                    placeholder="operator@nextransit.ai"
                    className="h-12 rounded-2xl"
                    {...register("email", { required: true })}
                />
            </div>

            <div className="space-y-2">
                <Label>Password</Label>
                <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-12 rounded-2xl"
                    {...register("password", { required: true })}
                />
            </div>

            <Button disabled={isSubmitting} className="h-12 w-full rounded-2xl">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    "Login"
                )}
            </Button>
        </form>
    );
}