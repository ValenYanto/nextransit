import type { CrowdLevel, TrafficLevel } from "@/lib/prediction/eta";

export type SimulationScenario = "NORMAL" | "RUSH_HOUR" | "RAIN" | "EVENT";

export type SimulationResult = {
    scenario: SimulationScenario;
    trafficLevel: TrafficLevel;
    crowdLevel: CrowdLevel;
    delayMultiplier: number;
    passengerMultiplier: number;
    recommendation: string;
    summary: string;
};

export function simulateScenario(scenario: SimulationScenario): SimulationResult {
    switch (scenario) {
        case "RUSH_HOUR":
            return {
                scenario,
                trafficLevel: "HIGH",
                crowdLevel: "HIGH",
                delayMultiplier: 1.35,
                passengerMultiplier: 1.55,
                recommendation:
                    "Tambah frekuensi feeder dan kurangi headway pada rute dengan koneksi MRT/LRT.",
                summary:
                    "Jam sibuk meningkatkan kepadatan penumpang dan memperpanjang waktu perjalanan.",
            };

        case "RAIN":
            return {
                scenario,
                trafficLevel: "HIGH",
                crowdLevel: "MEDIUM",
                delayMultiplier: 1.45,
                passengerMultiplier: 1.15,
                recommendation:
                    "Aktifkan buffer jadwal dan prioritas armada di rute rawan macet.",
                summary:
                    "Hujan memperlambat kecepatan armada dan menurunkan akurasi ETA.",
            };

        case "EVENT":
            return {
                scenario,
                trafficLevel: "MEDIUM",
                crowdLevel: "CRITICAL",
                delayMultiplier: 1.25,
                passengerMultiplier: 2.1,
                recommendation:
                    "Tempatkan armada tambahan di titik event dan stasiun interchange terdekat.",
                summary:
                    "Event besar memicu lonjakan penumpang pada halte dan stasiun tertentu.",
            };

        case "NORMAL":
        default:
            return {
                scenario: "NORMAL",
                trafficLevel: "LOW",
                crowdLevel: "LOW",
                delayMultiplier: 1,
                passengerMultiplier: 1,
                recommendation: "Pertahankan operasi normal dan monitoring berkala.",
                summary: "Kondisi normal dengan kepadatan rendah dan ETA stabil.",
            };
    }
}