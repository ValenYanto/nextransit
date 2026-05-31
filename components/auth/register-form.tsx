"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>();

  async function onSubmit(values: RegisterFormValues) {
    setMessage(null);

    if (values.password !== values.confirmPassword) {
      setMessage("Password confirmation does not match.");
      return;
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    });

    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "Unable to create account.");
      return;
    }

    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      {message ? (
        <p className="rounded-xl border border-[#757780]/30 bg-[#757780]/10 px-3 py-2 text-sm text-[#757780]">
          {message}
        </p>
      ) : null}

      <Field label="Name" placeholder="Your name" registration={register("name", { required: true })} />
      <Field
        label="Email"
        placeholder="you@example.com"
        type="email"
        registration={register("email", { required: true })}
      />

      <PasswordField
        label="Password"
        placeholder="Minimum 6 characters"
        showPassword={showPassword}
        onToggle={() => setShowPassword((visible) => !visible)}
        registration={register("password", { required: true, minLength: 6 })}
      />
      <PasswordField
        label="Confirm Password"
        placeholder="Repeat password"
        showPassword={showPassword}
        onToggle={() => setShowPassword((visible) => !visible)}
        registration={register("confirmPassword", { required: true })}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#6CCFF6] px-6 font-semibold text-[#001011] disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create account
      </button>
    </form>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  registration,
}: {
  label: string;
  placeholder: string;
  type?: string;
  registration: ReturnType<typeof useForm<RegisterFormValues>>["register"] extends (
    ...args: never[]
  ) => infer R
    ? R
    : never;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-xl border border-black/10 bg-white px-4 text-[#001011] outline-none focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.07] dark:bg-[#001011] dark:text-[#FFFFFC]"
        {...registration}
      />
    </label>
  );
}

function PasswordField({
  label,
  placeholder,
  showPassword,
  onToggle,
  registration,
}: {
  label: string;
  placeholder: string;
  showPassword: boolean;
  onToggle: () => void;
  registration: ReturnType<typeof useForm<RegisterFormValues>>["register"] extends (
    ...args: never[]
  ) => infer R
    ? R
    : never;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">{label}</span>
      <span className="flex h-[52px] items-center rounded-xl border border-black/10 bg-white px-4 focus-within:border-[#6CCFF6] focus-within:ring-2 focus-within:ring-[#6CCFF6]/20 dark:border-white/[0.07] dark:bg-[#001011]">
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[#001011] outline-none dark:text-[#FFFFFC]"
          {...registration}
        />
        <button type="button" onClick={onToggle} className="ml-2 text-[#757780]">
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
