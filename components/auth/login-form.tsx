"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/passenger/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "user@nextransit.ai",
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
      setError("Email or password is incorrect.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      {callbackUrl !== "/passenger/dashboard" ? (
        <p className="rounded-xl border border-[#6CCFF6]/30 bg-[#6CCFF6]/10 px-3 py-2 text-[13px] text-[#757780]">
          Sign in to continue tracking your route.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-[#757780]/30 bg-[#757780]/10 px-3 py-2 text-sm text-[#757780]">
          {error}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">Email</span>
        <input
          type="email"
          placeholder="user@nextransit.ai"
          className="h-[52px] w-full rounded-xl border border-black/10 bg-white px-4 text-[#001011] outline-none focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.07] dark:bg-[#001011] dark:text-[#FFFFFC]"
          {...register("email", { required: true })}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">Password</span>
        <span className="flex h-[52px] items-center rounded-xl border border-black/10 bg-white px-4 focus-within:border-[#6CCFF6] focus-within:ring-2 focus-within:ring-[#6CCFF6]/20 dark:border-white/[0.07] dark:bg-[#001011]">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="password123"
            className="min-w-0 flex-1 bg-transparent text-[#001011] outline-none dark:text-[#FFFFFC]"
            {...register("password", { required: true })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="ml-2 text-[#757780]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#6CCFF6] px-6 font-semibold text-[#001011] disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign In
      </button>
    </form>
  );
}
