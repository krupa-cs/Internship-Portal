const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleCommand = async (command, args, user) => {
    switch (command) {
        case 'my_offers':
            return getMyOffers(user);
        case 'create_offer':
            // Placeholder for create_offer logic
            return "The '!create_offer' command is not yet implemented.";
        default:
            return `Unknown command: ${command}`;
    }
};

const getMyOffers = async (user) => {
    const offers = await prisma.internshipOffer.findMany({
        where: { recruiterId: user.id },
        select: {
            id: true,
            title: true,
            status: true,
            created_at: true,
        },
        orderBy: { created_at: 'desc' },
    });

    if (offers.length === 0) {
        return "You have not posted any offers.";
    }

    const offerList = offers.map(offer => 
        `ID: ${offer.id}, Title: "${offer.title}", Status: ${offer.status}, Created: ${offer.created_at.toDateString()}`
    ).join('\n');

    return `Your Offers:\n${offerList}`;
};

module.exports = { handleCommand };
