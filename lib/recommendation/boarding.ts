type BoardingRecommendationParams = {
    crowdLevel: string;
    etaMinutes?: number | null;
    nextVehicleEtaMinutes?: number | null;
};

export function getBoardingRecommendation({
    crowdLevel,
    etaMinutes,
    nextVehicleEtaMinutes,
}: BoardingRecommendationParams) {
    const normalized = crowdLevel.toUpperCase();
    const nextVehicleGap =
        etaMinutes != null && nextVehicleEtaMinutes != null
            ? nextVehicleEtaMinutes - etaMinutes
            : null;

    if (normalized === "LOW") {
        return {
            label: "Recommended to board",
            severity: "LOW" as const,
            description: "This vehicle has comfortable capacity and a reliable ETA.",
        };
    }

    if (normalized === "MEDIUM") {
        return {
            label: "Good option",
            severity: "MEDIUM" as const,
            description: "Crowd level is manageable for most passengers.",
        };
    }

    if (normalized === "HIGH") {
        return {
            label: "Board if urgent",
            severity: "HIGH" as const,
            description:
                nextVehicleGap != null && nextVehicleGap <= 8
                    ? "A less crowded unit may be worth waiting for."
                    : "Board if timing matters; this unit is busy.",
        };
    }

    return {
        label: "Consider waiting",
        severity: "CRITICAL" as const,
        description:
            nextVehicleGap != null && nextVehicleGap <= 10
                ? "This vehicle is very crowded and the next unit may be acceptable."
                : "This vehicle is very crowded. Board only if necessary.",
    };
}
