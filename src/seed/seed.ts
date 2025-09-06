import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../modules/auth/auth.model';
import { UserProfile } from '../modules/user/user.model';
import { Zone } from '../modules/location/location.model';
import { logger } from '../config/logger';
import { hashPassword } from '../utils/crypto';

const sampleUsers = [
    {
        email: 'tourist@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        firstName: 'John',
        lastName: 'Tourist',
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'US',
        isVerified: true
    },
    {
        email: 'authority@example.com',
        password: 'password123',
        phoneNumber: '+0987654321',
        firstName: 'Jane',
        lastName: 'Authority',
        dateOfBirth: new Date('1985-05-15'),
        nationality: 'IN',
        role: 'authority',
        isVerified: true
    }
];

const sampleZones = [
    {
        name: 'Safe Tourist Zone',
        type: 'safe',
        coordinates: [
            {
                type: 'Point',
                coordinates: [91.7500, 26.1500]
            },
            {
                type: 'Point',
                coordinates: [91.8000, 26.1500]
            },
            {
                type: 'Point',
                coordinates: [91.8000, 26.2000]
            },
            {
                type: 'Point',
                coordinates: [91.7500, 26.2000]
            }
        ],
        riskLevel: 'low',
        description: 'Safe area for tourists with police patrols'
    },
    {
        name: 'Restricted Area',
        type: 'restricted',
        coordinates: [
            {
                type: 'Point',
                coordinates: [91.8500, 26.2500]
            },
            {
                type: 'Point',
                coordinates: [91.9000, 26.2500]
            },
            {
                type: 'Point',
                coordinates: [91.9000, 26.3000]
            },
            {
                type: 'Point',
                coordinates: [91.8500, 26.3000]
            }
        ],
        riskLevel: 'high',
        description: 'Restricted area - entry prohibited'
    }
];

const seedDatabase = async (): Promise<void> => {
    try {
        // Connect to database
        await connectDB();

        logger.info('Starting database seeding...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            UserProfile.deleteMany({}),
            Zone.deleteMany({})
        ]);

        logger.info('Cleared existing data');

        // Create sample users
        const createdUsers = await Promise.all(
            sampleUsers.map(async (userData) => {
                const hashedPassword = await hashPassword(userData.password);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                return await user.save();
            })
        );

        logger.info(`Created ${createdUsers.length} users`);

        // Create sample user profile for tourist
        const touristUser = createdUsers.find(u => u.role === 'tourist');
        if (touristUser) {
            const userProfile = new UserProfile({
                userId: touristUser._id,
                emergencyContacts: [
                    {
                        name: 'Emergency Contact 1',
                        phone: '+11234567890',
                        email: 'emergency1@example.com',
                        relationship: 'Family'
                    }
                ],
                settings: {
                    trackingEnabled: true,
                    notificationsEnabled: true,
                    language: 'en',
                    emergencyAlertContacts: true
                }
            });

            await userProfile.save();
            logger.info('Created user profile for tourist');
        }

        // Create sample zones
        const createdZones = await Promise.all(
            sampleZones.map(zoneData => {
                const zone = new Zone(zoneData);
                return zone.save();
            })
        );

        logger.info(`Created ${createdZones.length} zones`);

        logger.info('Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Database seeding failed:', error);
        process.exit(1);
    }
};

// Run seeding if called directly
if (require.main === module) {
    seedDatabase();
}

export { seedDatabase };