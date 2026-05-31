type PageHeadingProps = {
    label?: string;
    title: string;
    description?: string;
};

export function PageHeading({ label, title, description }: PageHeadingProps) {
    return (
        <div className="mb-8">
            {label ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#6CCFF6]">
                    {label}
                </p>
            ) : null}

            <h1 className="text-3xl font-bold text-[#001011] dark:text-[#FFFFFC]">
                {title}
            </h1>

            {description ? (
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#757780]">
                    {description}
                </p>
            ) : null}
        </div>
    );
}
