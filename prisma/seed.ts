import bcrypt from "bcryptjs";

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log("Seeding NexTransit...");

    const password = await bcrypt.hash("password123", 12);

    await prisma.user.upsert({
        where: { email: "admin@nextransit.ai" },
        update: {},
        create: {
            name: "NexTransit Admin",
            email: "admin@nextransit.ai",
            password,
            role: "ADMIN",
        },
    });

    await prisma.user.upsert({
        where: { email: "operator@nextransit.ai" },
        update: {},
        create: {
            name: "DISHUB Operator",
            email: "operator@nextransit.ai",
            password,
            role: "OPERATOR",
        },
    });

    await prisma.user.upsert({
        where: { email: "user@nextransit.ai" },
        update: {},
        create: {
            name: "Transit User",
            email: "user@nextransit.ai",
            password,
            role: "USER",
        },
    });

    const routeB12 = await prisma.route.upsert({
        where: { code: "B12" },
        update: {},
        create: {
            code: "B12",
            name: "Feeder Lebak Bulus - Fatmawati",
            type: "FEEDER",
            origin: "Lebak Bulus",
            destination: "Fatmawati",
            distanceKm: 8.4,
        },
    });

    const routeM1 = await prisma.route.upsert({
        where: { code: "MRT-NS" },
        update: {},
        create: {
            code: "MRT-NS",
            name: "MRT North-South Line",
            type: "MRT",
            origin: "Lebak Bulus",
            destination: "Bundaran HI",
            distanceKm: 15.7,
        },
    });

    const stops = [
        {
            code: "LB",
            name: "Lebak Bulus Transit Hub",
            type: "STATION" as const,
            latitude: -6.2892,
            longitude: 106.7747,
            area: "Jakarta Selatan",
        },
        {
            code: "FTM",
            name: "Fatmawati Station",
            type: "STATION" as const,
            latitude: -6.2929,
            longitude: 106.7936,
            area: "Jakarta Selatan",
        },
        {
            code: "DKA",
            name: "Dukuh Atas Interchange",
            type: "STATION" as const,
            latitude: -6.2008,
            longitude: 106.8229,
            area: "Jakarta Pusat",
        },
        {
            code: "KMP",
            name: "Campus Feeder Stop",
            type: "BUS_STOP" as const,
            latitude: -6.301,
            longitude: 106.785,
            area: "Jakarta Selatan",
        },
    ];

    for (const stop of stops) {
        await prisma.stop.upsert({
            where: { code: stop.code },
            update: {},
            create: stop,
        });
    }

    const lb = await prisma.stop.findUniqueOrThrow({ where: { code: "LB" } });
    const ftm = await prisma.stop.findUniqueOrThrow({ where: { code: "FTM" } });
    const dka = await prisma.stop.findUniqueOrThrow({ where: { code: "DKA" } });
    const kmp = await prisma.stop.findUniqueOrThrow({ where: { code: "KMP" } });

    const vehicles = [
        {
            code: "FD-B12-01",
            plateNumber: "B 1201 NX",
            type: "FEEDER" as const,
            capacity: 32,
            status: "ACTIVE" as const,
            currentRouteId: routeB12.id,
            latitude: -6.301,
            longitude: 106.785,
            speedKmh: 22,
        },
        {
            code: "FD-B12-02",
            plateNumber: "B 1202 NX",
            type: "FEEDER" as const,
            capacity: 32,
            status: "DELAYED" as const,
            currentRouteId: routeB12.id,
            latitude: -6.295,
            longitude: 106.787,
            speedKmh: 12,
        },
        {
            code: "MRT-NS-08",
            plateNumber: null,
            type: "MRT" as const,
            capacity: 800,
            status: "ACTIVE" as const,
            currentRouteId: routeM1.id,
            latitude: -6.2892,
            longitude: 106.7747,
            speedKmh: 45,
        },
    ];

    for (const vehicle of vehicles) {
        const { latitude, longitude, speedKmh, ...vehicleData } = vehicle;

        const createdVehicle = await prisma.vehicle.upsert({
            where: { code: vehicle.code },
            update: vehicleData,
            create: vehicleData,
        });

        await prisma.vehiclePosition.create({
            data: {
                vehicleId: createdVehicle.id,
                latitude,
                longitude,
                speedKmh,
                recordedAt: new Date(),
            },
        });

        await prisma.vehicleOccupancy.create({
            data: {
                vehicleId: createdVehicle.id,
                passengerCount:
                    createdVehicle.type === "MRT"
                        ? 420
                        : createdVehicle.status === "DELAYED"
                            ? 29
                            : 18,
                capacity: createdVehicle.capacity,
                recordedAt: new Date(),
            },
        });
    }

    const schedules = [
        {
            routeId: routeB12.id,
            stopId: kmp.id,
            arrivalTime: "07:00",
            departureTime: "07:03",
            sequence: 1,
        },
        {
            routeId: routeB12.id,
            stopId: lb.id,
            arrivalTime: "07:18",
            departureTime: "07:22",
            sequence: 2,
        },
        {
            routeId: routeB12.id,
            stopId: ftm.id,
            arrivalTime: "07:35",
            departureTime: "07:38",
            sequence: 3,
        },
        {
            routeId: routeM1.id,
            stopId: lb.id,
            arrivalTime: "07:25",
            departureTime: "07:27",
            sequence: 1,
        },
        {
            routeId: routeM1.id,
            stopId: ftm.id,
            arrivalTime: "07:34",
            departureTime: "07:36",
            sequence: 2,
        },
        {
            routeId: routeM1.id,
            stopId: dka.id,
            arrivalTime: "07:55",
            departureTime: "07:58",
            sequence: 3,
        },
    ];

    await prisma.schedule.deleteMany();

    for (const schedule of schedules) {
        await prisma.schedule.create({
            data: schedule,
        });
    }

    await prisma.passengerTap.createMany({
        data: [
            {
                stopId: kmp.id,
                countIn: 38,
                countOut: 4,
                timestamp: new Date(),
            },
            {
                stopId: lb.id,
                countIn: 142,
                countOut: 78,
                timestamp: new Date(),
            },
            {
                stopId: ftm.id,
                countIn: 96,
                countOut: 88,
                timestamp: new Date(),
            },
            {
                stopId: dka.id,
                countIn: 210,
                countOut: 185,
                timestamp: new Date(),
            },
        ],
    });

    await prisma.crowdPrediction.createMany({
        data: [
            {
                stopId: kmp.id,
                densityLevel: "MEDIUM",
                predictedCount: 44,
                confidence: 0.82,
                reason: "Morning campus feeder demand is increasing.",
            },
            {
                stopId: lb.id,
                densityLevel: "HIGH",
                predictedCount: 168,
                confidence: 0.88,
                reason: "High transfer volume between feeder and MRT.",
            },
            {
                stopId: ftm.id,
                densityLevel: "MEDIUM",
                predictedCount: 103,
                confidence: 0.79,
                reason: "Stable passenger flow detected.",
            },
            {
                stopId: dka.id,
                densityLevel: "CRITICAL",
                predictedCount: 238,
                confidence: 0.9,
                reason: "Interchange congestion during rush hour.",
            },
        ],
    });

    console.log("Seed completed.");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });