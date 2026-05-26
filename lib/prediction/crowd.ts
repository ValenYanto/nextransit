export type DensityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getDensityLevel(count: number): DensityLevel {
    if (count >= 200) return "CRITICAL";
    if (count >= 120) return "HIGH";
    if (count >= 50) return "MEDIUM";
    return "LOW";
}

export function getDensityDescription(level: DensityLevel) {
    const descriptions: Record<DensityLevel, string> = {
        LOW: "Area relatif lengang dan waktu tunggu cenderung stabil.",
        MEDIUM: "Kepadatan sedang, masih terkendali untuk operasional normal.",
        HIGH: "Kepadatan tinggi, perlu pemantauan dan potensi penambahan armada.",
        CRITICAL:
            "Kepadatan kritis, operator disarankan segera melakukan redistribusi armada.",
    };

    return descriptions[level];
}

export function getDensityRecommendation(level: DensityLevel) {
    const recommendations: Record<DensityLevel, string> = {
        LOW: "Pertahankan jadwal normal.",
        MEDIUM: "Pantau arus penumpang dalam 15–30 menit ke depan.",
        HIGH: "Siapkan armada tambahan atau percepat headway.",
        CRITICAL: "Alihkan armada terdekat dan aktifkan skenario rush hour.",
    };

    return recommendations[level];
}