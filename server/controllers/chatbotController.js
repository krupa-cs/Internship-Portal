const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Placeholder for bot modules
const recruiterBot = require('../bots/recruiterBot');
const facultyBot = require('../bots/facultyBot');
const adminBot = require('../bots/adminBot');
const securityBot = require('../bots/securityBot');

const botMap = {
    'Recruiter': recruiterBot,
    'Faculty': facultyBot,
    'Admin': adminBot,
    'Master Admin': adminBot, // Master Admin uses the Admin bot
    'Security': securityBot, // A virtual role for security commands
};

exports.handleChatMessage = async (req, res) => {
    const { message } = req.body;
    const user = req.user;

    if (!message || !message.startsWith('!')) {
        return res.status(400).json({ reply: "Invalid command. Commands must start with '!'." });
    }

    const [command, ...args] = message.slice(1).split(' ');
    const bot = botMap[user.role];

    if (!bot) {
        return res.status(403).json({ reply: `No bot available for your role: ${user.role}` });
    }

    try {
        const reply = await bot.handleCommand(command, args, user);
        res.json({ reply });
    } catch (error) {
        console.error("Chatbot command error:", error);
        res.status(500).json({ reply: error.message || "An error occurred while processing your command." });
    }
};
