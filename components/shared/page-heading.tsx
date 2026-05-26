type PageHeadingProps = {
    label?: string;
    title: string;
    description?: string;
};

export function PageHeading({ label, title, description }: PageHeadingProps) {
    return (
        <div className="mb-8">
            {label ? (
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                    {label}
                </p>
            ) : null}

            <h1 className="mt-2 font-[var(--font-jakarta)] text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {title}
            </h1>

            {description ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            ) : null}
        </div>
    );
}