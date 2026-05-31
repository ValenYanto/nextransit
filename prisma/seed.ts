import bcrypt from "bcryptjs";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { rebuildRoutePathFromSchedules } from "../lib/routing/rebuild-route-path";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

const users = [
    {
        name: "NexTransit Admin",
        email: "admin@nextransit.ai",
        role: "ADMIN" as const,
    },
    {
        name: "DISHUB Operator",
        email: "operator@nextransit.ai",
        role: "OPERATOR" as const,
    },
    {
        name: "Transit User",
        email: "user@nextransit.ai",
        role: "USER" as const,
    },
];

const modes = [
    {
        name: "TransJakarta",
        slug: "transjakarta",
        description: "BRT corridors and city bus services across Jakarta.",
        color: "#0891b2",
        icon: "bus",
    },
    {
        name: "MRT Jakarta",
        slug: "mrt-jakarta",
        description: "High-capacity north-south urban rail service.",
        color: "#2563eb",
        icon: "train-front",
    },
    {
        name: "LRT Jabodebek",
        slug: "lrt-jabodebek",
        description: "Regional light rail connection for Jabodebek commuters.",
        color: "#7c3aed",
        icon: "tram-front",
    },
    {
        name: "Feeder Bus",
        slug: "feeder-bus",
        description: "Campus, school, and local feeder connections.",
        color: "#0f766e",
        icon: "school",
    },
];

const stops = [
    { code: "BLM", name: "Blok M", type: "TERMINAL" as const, latitude: -6.2446, longitude: 106.8006, area: "Jakarta Selatan" },
    { code: "ASN", name: "ASEAN", type: "STATION" as const, latitude: -6.2389, longitude: 106.7988, area: "Jakarta Selatan" },
    { code: "SNY", name: "Senayan", type: "STATION" as const, latitude: -6.2267, longitude: 106.8027, area: "Jakarta Selatan" },
    { code: "BHI", name: "Bundaran HI", type: "STATION" as const, latitude: -6.1931, longitude: 106.8230, area: "Jakarta Pusat" },
    { code: "MON", name: "Monas", type: "BUS_STOP" as const, latitude: -6.1754, longitude: 106.8272, area: "Jakarta Pusat" },
    { code: "HRM", name: "Harmoni", type: "BUS_STOP" as const, latitude: -6.1667, longitude: 106.8216, area: "Jakarta Pusat" },
    { code: "KOT", name: "Kota", type: "TERMINAL" as const, latitude: -6.1375, longitude: 106.8133, area: "Jakarta Barat" },
    { code: "RGN", name: "Ragunan", type: "TERMINAL" as const, latitude: -6.3057, longitude: 106.8207, area: "Jakarta Selatan" },
    { code: "DKA", name: "Dukuh Atas", type: "STATION" as const, latitude: -6.2008, longitude: 106.8229, area: "Jakarta Pusat" },
    { code: "STB", name: "Setiabudi", type: "STATION" as const, latitude: -6.2054, longitude: 106.8292, area: "Jakarta Selatan" },
    { code: "RSS", name: "Rasuna Said", type: "STATION" as const, latitude: -6.2146, longitude: 106.8339, area: "Jakarta Selatan" },
    { code: "KNG", name: "Kuningan", type: "STATION" as const, latitude: -6.2242, longitude: 106.8388, area: "Jakarta Selatan" },
    { code: "PNC", name: "Pancoran", type: "STATION" as const, latitude: -6.2434, longitude: 106.8467, area: "Jakarta Selatan" },
    { code: "CKK", name: "Cikoko", type: "STATION" as const, latitude: -6.2498, longitude: 106.8585, area: "Jakarta Selatan" },
    { code: "CWG", name: "Cawang", type: "STATION" as const, latitude: -6.2556, longitude: 106.8707, area: "Jakarta Timur" },
    { code: "HLM", name: "Halim", type: "STATION" as const, latitude: -6.2502, longitude: 106.8913, area: "Jakarta Timur" },
    { code: "JBN", name: "Jatibening Baru", type: "STATION" as const, latitude: -6.2572, longitude: 106.9312, area: "Bekasi" },
    { code: "CK1", name: "Cikunir 1", type: "STATION" as const, latitude: -6.2587, longitude: 106.9567, area: "Bekasi" },
    { code: "CK2", name: "Cikunir 2", type: "STATION" as const, latitude: -6.2617, longitude: 106.9833, area: "Bekasi" },
    { code: "BKB", name: "Bekasi Barat", type: "STATION" as const, latitude: -6.2667, longitude: 107.0138, area: "Bekasi" },
    { code: "LBB", name: "Lebak Bulus", type: "STATION" as const, latitude: -6.2892, longitude: 106.7747, area: "Jakarta Selatan" },
    { code: "FTM", name: "Fatmawati", type: "STATION" as const, latitude: -6.2929, longitude: 106.7936, area: "Jakarta Selatan" },
    { code: "JTM", name: "Jati Mulya", type: "STATION" as const, latitude: -6.2731, longitude: 107.0375, area: "Bekasi" },
    { code: "CFS", name: "Campus Feeder Stop", type: "BUS_STOP" as const, latitude: -6.3010, longitude: 106.7850, area: "Jakarta Selatan" },
];

const routeDefinitions = [
    {
        code: "K1",
        name: "K1 Blok M - Kota",
        type: "BUS" as const,
        origin: "Blok M",
        destination: "Kota",
        distanceKm: 12.9,
        modeSlug: "transjakarta",
        stopCodes: ["BLM", "ASN", "SNY", "BHI", "MON", "HRM", "KOT"],
    },
    {
        code: "K6",
        name: "K6 Ragunan - Dukuh Atas",
        type: "BUS" as const,
        origin: "Ragunan",
        destination: "Dukuh Atas",
        distanceKm: 14.2,
        modeSlug: "transjakarta",
        stopCodes: ["RGN", "FTM", "SNY", "BHI", "DKA"],
    },
    {
        code: "MRT-NS",
        name: "MRT North-South Line",
        type: "MRT" as const,
        origin: "Lebak Bulus",
        destination: "Bundaran HI",
        distanceKm: 15.7,
        modeSlug: "mrt-jakarta",
        stopCodes: ["LBB", "FTM", "BLM", "ASN", "SNY", "BHI"],
    },
    {
        code: "LRT-DJ",
        name: "LRT Dukuh Atas - Jati Mulya",
        type: "LRT" as const,
        origin: "Dukuh Atas",
        destination: "Jati Mulya",
        distanceKm: 27.3,
        modeSlug: "lrt-jabodebek",
        stopCodes: ["DKA", "STB", "RSS", "KNG", "PNC", "CKK", "CWG", "HLM", "JBN", "CK1", "CK2", "BKB", "JTM"],
    },
    {
        code: "FDR-CAMPUS",
        name: "Feeder Campus - Lebak Bulus",
        type: "FEEDER" as const,
        origin: "Campus Feeder Stop",
        destination: "Lebak Bulus",
        distanceKm: 5.8,
        modeSlug: "feeder-bus",
        stopCodes: ["CFS", "LBB", "FTM"],
    },
];

const vehicleDefinitions = [
    { code: "TJ-K1-01", plateNumber: "B 7001 TJ", type: "BUS" as const, capacity: 80, status: "ACTIVE" as const, routeCode: "K1", pathIndex: 6, speedKmh: 28, passengerCount: 24, direction: "OUTBOUND" },
    { code: "TJ-K1-02", plateNumber: "B 7002 TJ", type: "BUS" as const, capacity: 80, status: "CROWDED" as const, routeCode: "K1", pathIndex: 270, speedKmh: 17, passengerCount: 74, direction: "INBOUND" },
    { code: "TJ-K1-03", plateNumber: "B 7003 TJ", type: "BUS" as const, capacity: 80, status: "ACTIVE" as const, routeCode: "K1", pathIndex: 450, speedKmh: 22, passengerCount: 46, direction: "OUTBOUND" },
    { code: "TJ-K6-11", plateNumber: "B 7611 TJ", type: "BUS" as const, capacity: 75, status: "ACTIVE" as const, routeCode: "K6", pathIndex: 80, speedKmh: 24, passengerCount: 39, direction: "OUTBOUND" },
    { code: "TJ-K6-12", plateNumber: "B 7612 TJ", type: "BUS" as const, capacity: 75, status: "DELAYED" as const, routeCode: "K6", pathIndex: 520, speedKmh: 12, passengerCount: 68, direction: "INBOUND" },
    { code: "MRT-NS-08", plateNumber: null, type: "MRT" as const, capacity: 800, status: "ACTIVE" as const, routeCode: "MRT-NS", pathIndex: 14, speedKmh: 47, passengerCount: 360, direction: "OUTBOUND" },
    { code: "MRT-NS-12", plateNumber: null, type: "MRT" as const, capacity: 800, status: "CROWDED" as const, routeCode: "MRT-NS", pathIndex: 90, speedKmh: 41, passengerCount: 690, direction: "INBOUND" },
    { code: "LRT-DJ-03", plateNumber: null, type: "LRT" as const, capacity: 740, status: "ACTIVE" as const, routeCode: "LRT-DJ", pathIndex: 18, speedKmh: 38, passengerCount: 520, direction: "OUTBOUND" },
    { code: "LRT-DJ-07", plateNumber: null, type: "LRT" as const, capacity: 740, status: "ACTIVE" as const, routeCode: "LRT-DJ", pathIndex: 55, speedKmh: 52, passengerCount: 185, direction: "INBOUND" },
    { code: "FD-CAMP-01", plateNumber: "B 1201 NX", type: "FEEDER" as const, capacity: 32, status: "ACTIVE" as const, routeCode: "FDR-CAMPUS", pathIndex: 30, speedKmh: 22, passengerCount: 12, direction: "OUTBOUND" },
    { code: "FD-CAMP-02", plateNumber: "B 1202 NX", type: "FEEDER" as const, capacity: 32, status: "CROWDED" as const, routeCode: "FDR-CAMPUS", pathIndex: 160, speedKmh: 18, passengerCount: 31, direction: "INBOUND" },
];

function timeFor(sequence: number, routeIndex: number) {
    const totalMinutes = 6 * 60 + routeIndex * 10 + sequence * 7;
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const minutes = (totalMinutes % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

async function main() {
    console.log("🌱 Seeding NexTransit database...");

    await prisma.etaPrediction.deleteMany();
    await prisma.vehiclePosition.deleteMany();
    await prisma.vehicleOccupancy.deleteMany();
    await prisma.passengerTap.deleteMany();
    await prisma.crowdPrediction.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.routePathPoint.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.route.deleteMany();
    await prisma.stop.deleteMany();
    await prisma.transportMode.deleteMany();
    await prisma.user.deleteMany();
    console.log("🗑  Cleared existing data");

    const password = await bcrypt.hash("password123", 12);

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                role: user.role,
            },
            create: {
                ...user,
                password,
            },
        });
    }
    console.log("✅ Users created");

    const modeBySlug = new Map<string, { id: string }>();
    for (const mode of modes) {
        const record = await prisma.transportMode.upsert({
            where: { slug: mode.slug },
            update: {
                name: mode.name,
                description: mode.description,
                color: mode.color,
                icon: mode.icon,
                isActive: true,
            },
            create: {
                ...mode,
                isActive: true,
            },
        });
        modeBySlug.set(mode.slug, record);
    }
    console.log("✅ Modes created");

    const stopByCode = new Map<string, { id: string }>();
    for (const stop of stops) {
        const record = await prisma.stop.upsert({
            where: { code: stop.code },
            update: {
                name: stop.name,
                type: stop.type,
                latitude: stop.latitude,
                longitude: stop.longitude,
                area: stop.area,
                isActive: true,
            },
            create: {
                ...stop,
                isActive: true,
            },
        });
        stopByCode.set(stop.code, record);
    }
    console.log("✅ Stops created");

    const routeByCode = new Map<string, { id: string }>();
    for (const route of routeDefinitions) {
        const mode = modeBySlug.get(route.modeSlug);
        if (!mode) throw new Error(`Missing mode ${route.modeSlug}`);

        const record = await prisma.route.upsert({
            where: { code: route.code },
            update: {
                name: route.name,
                type: route.type,
                origin: route.origin,
                destination: route.destination,
                distanceKm: route.distanceKm,
                modeId: mode.id,
                isActive: true,
            },
            create: {
                code: route.code,
                name: route.name,
                type: route.type,
                origin: route.origin,
                destination: route.destination,
                distanceKm: route.distanceKm,
                modeId: mode.id,
                isActive: true,
            },
        });
        routeByCode.set(route.code, record);
    }
    console.log("✅ Routes created");

    await prisma.route.updateMany({
        where: {
            code: {
                notIn: routeDefinitions.map((route) => route.code),
            },
        },
        data: {
            isActive: false,
            pathSource: "FALLBACK",
            pathPointCount: 0,
        },
    });

    const seededPathByCode = new Map<string, Array<{ latitude: number; longitude: number }>>();

    for (const [routeIndex, route] of routeDefinitions.entries()) {
        const routeRecord = routeByCode.get(route.code);
        if (!routeRecord) throw new Error(`Missing route ${route.code}`);

        for (const [index, stopCode] of route.stopCodes.entries()) {
            const stop = stopByCode.get(stopCode);
            if (!stop) throw new Error(`Missing stop ${stopCode}`);

            const sequence = index + 1;
            const arrivalTime = timeFor(sequence, routeIndex);
            const departureTime = timeFor(sequence + 1, routeIndex);

            await prisma.schedule.upsert({
                where: {
                    routeId_sequence: {
                        routeId: routeRecord.id,
                        sequence,
                    },
                },
                update: {
                    stopId: stop.id,
                    arrivalTime,
                    departureTime,
                },
                create: {
                    routeId: routeRecord.id,
                    stopId: stop.id,
                    arrivalTime,
                    departureTime,
                    sequence,
                },
            });
        }

        const report = await rebuildRoutePathFromSchedules(prisma, routeRecord.id, {
            log: true,
        });
        const pathPoints = await prisma.routePathPoint.findMany({
            where: { routeId: routeRecord.id },
            orderBy: { sequence: "asc" },
        });
        seededPathByCode.set(route.code, pathPoints);

        console.log(
            `Route ${route.code}: source=${report.source}, points=${report.pathPointCount}`,
        );
    }

    for (const vehicle of vehicleDefinitions) {
        const route = routeByCode.get(vehicle.routeCode);
        if (!route) throw new Error(`Missing route ${vehicle.routeCode}`);

        const vehicleData = {
            code: vehicle.code,
            plateNumber: vehicle.plateNumber,
            type: vehicle.type,
            capacity: vehicle.capacity,
            status: vehicle.status,
            direction: vehicle.direction,
        };
        const record = await prisma.vehicle.upsert({
            where: { code: vehicle.code },
            update: {
                ...vehicleData,
                currentRouteId: route.id,
            },
            create: {
                ...vehicleData,
                currentRouteId: route.id,
            },
        });
        const routePath = seededPathByCode.get(vehicle.routeCode) ?? [];
        const startPoint = routePath[Math.min(vehicle.pathIndex, Math.max(routePath.length - 1, 0))] ?? routePath[0];

        await prisma.vehiclePosition.create({
            data: {
                vehicleId: record.id,
                latitude: startPoint?.latitude ?? 0,
                longitude: startPoint?.longitude ?? 0,
                speedKmh: vehicle.speedKmh,
                heading: vehicle.speedKmh > 30 ? 35 : 12,
                recordedAt: new Date(),
            },
        });

        await prisma.vehicleOccupancy.create({
            data: {
                vehicleId: record.id,
                passengerCount: vehicle.passengerCount,
                capacity: record.capacity,
                recordedAt: new Date(),
            },
        });
    }
    console.log("✅ Vehicles created");

    await prisma.vehicle.updateMany({
        where: {
            code: {
                notIn: vehicleDefinitions.map((vehicle) => vehicle.code),
            },
        },
        data: {
            status: "OFFLINE",
            currentRouteId: null,
        },
    });

    await prisma.passengerTap.createMany({
        data: [
            { stopId: stopByCode.get("DKA")!.id, countIn: 210, countOut: 185, timestamp: new Date() },
            { stopId: stopByCode.get("BHI")!.id, countIn: 188, countOut: 130, timestamp: new Date() },
            { stopId: stopByCode.get("LBB")!.id, countIn: 142, countOut: 78, timestamp: new Date() },
            { stopId: stopByCode.get("HRM")!.id, countIn: 96, countOut: 88, timestamp: new Date() },
            { stopId: stopByCode.get("CFS")!.id, countIn: 38, countOut: 4, timestamp: new Date() },
        ],
    });

    await prisma.crowdPrediction.createMany({
        data: [
            { stopId: stopByCode.get("DKA")!.id, densityLevel: "CRITICAL", predictedCount: 238, confidence: 0.9, reason: "Rush hour transfer pressure between MRT, LRT, and TransJakarta." },
            { stopId: stopByCode.get("BHI")!.id, densityLevel: "HIGH", predictedCount: 190, confidence: 0.87, reason: "Office commute and interchange traffic are rising." },
            { stopId: stopByCode.get("LBB")!.id, densityLevel: "HIGH", predictedCount: 168, confidence: 0.88, reason: "High transfer volume between feeder and MRT." },
            { stopId: stopByCode.get("FTM")!.id, densityLevel: "MEDIUM", predictedCount: 103, confidence: 0.79, reason: "Stable passenger flow detected." },
            { stopId: stopByCode.get("CFS")!.id, densityLevel: "MEDIUM", predictedCount: 44, confidence: 0.82, reason: "Morning campus feeder demand is increasing." },
        ],
    });

    for (const route of routeDefinitions) {
        const routeRecord = routeByCode.get(route.code);
        if (!routeRecord) continue;

        const [pathPointsCount, stopsCount, vehiclesCount] = await Promise.all([
            prisma.routePathPoint.count({ where: { routeId: routeRecord.id } }),
            prisma.schedule.count({ where: { routeId: routeRecord.id } }),
            prisma.vehicle.count({ where: { currentRouteId: routeRecord.id } }),
        ]);

        console.log(
            `${route.code}: ${pathPointsCount} path points, ${stopsCount} stops, ${vehiclesCount} vehicles`,
        );
    }

    const routeSummary = await prisma.route.findMany({
        orderBy: [{ isActive: "desc" }, { code: "asc" }],
        include: { mode: true },
    });
    const activeRoutes = routeSummary.filter((route) => route.isActive);
    const inactiveRoutes = routeSummary.filter((route) => !route.isActive);

    console.log(`Active routes: ${activeRoutes.length}`);
    console.log(`Inactive/stale routes: ${inactiveRoutes.length}`);
    for (const route of routeSummary) {
        console.log(
            `Route ${route.code}: id=${route.id}, mode=${route.mode?.name ?? "MISSING"}, active=${route.isActive}`,
        );
    }

    console.log("🎉 Seed complete!");
    console.log("");
    console.log("Demo accounts:");
    console.log("  admin@nextransit.ai    / password123  (ADMIN)");
    console.log("  operator@nextransit.ai / password123  (OPERATOR)");
    console.log("  user@nextransit.ai     / password123  (USER)");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
