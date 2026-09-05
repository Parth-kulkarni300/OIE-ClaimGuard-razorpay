require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI, Type, Schema } = require('@google/genai');
const Razorpay = require('razorpay');

const app = express();
const port = 3001; // Changed to 3001 to allow Next.js on 3000

app.use(cors({ origin: '*' })); // Allow Next.js frontend
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Expose images for frontend

// Initialize AI and Razorpay
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let rzp;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'YOUR_RAZORPAY_KEY_ID_HERE') {
    try {
        rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    } catch (e) {
        console.error("Failed to initialize Razorpay:", e);
    }
}

// Setup multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

let claimsDB = [];

/**
 * Real Agentic AI Triage Engine using Gemini Vision
 */
async function analyzeClaim(claimText, imagePath) {
    try {
        const fileBytes = fs.readFileSync(imagePath);
        const base64Data = fileBytes.toString('base64');
        const mimeType = 'image/jpeg'; // Fallback assuming jpeg

        const prompt = `You are an expert insurance fraud investigator. 
        A customer has submitted an auto insurance claim with the following description: "${claimText}"
        Analyze the provided image of the car damage. 
        Does the visual damage match the description? 
        If the damage is minor and matches the description (e.g. minor scratch), approve it for straight-through processing (AUTO_PAY).
        If the text claims severe damage ("totaled", "destroyed") but the image shows minor or no damage, flag it for INVESTIGATE.
        If the text claims minor damage but the image shows severe damage, flag it for INVESTIGATE.
        If the image is completely unrelated to a car, flag it for INVESTIGATE.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                { inlineData: { data: base64Data, mimeType: mimeType } }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.INTEGER, description: "Risk score from 0 to 100 (0=Safest, 100=Highest Fraud Risk)" },
                        decision: { type: Type.STRING, enum: ["AUTO_PAY", "INVESTIGATE"], description: "The final routing decision" },
                        reasoning: { type: Type.STRING, description: "Detailed explanation of why this decision was made based on comparing the image and text" }
                    },
                    required: ["riskScore", "decision", "reasoning"]
                }
            }
        });

        return JSON.parse(response.text);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            riskScore: 99,
            decision: 'INVESTIGATE',
            reasoning: 'AI Error occurred. Manual review required.'
        };
    }
}

/**
 * RazorpayX Payouts Integration
 */
async function initiateRazorpayPayout(amount, accountNumber) {
    console.log(`[RazorpayX] Initiating payout of INR ${amount} to account ${accountNumber}...`);
    
    if (rzp) {
        try {
            // Note: In production, requires a contact and fund_account.
            const payout = await rzp.payouts.create({
                account_number: "2323230058348281", // Test account
                fund_account_id: "fa_" + accountNumber, 
                amount: amount * 100, // in paise
                currency: "INR",
                mode: "IMPS",
                purpose: "payout",
                queue_if_low_balance: true
            });
            return payout;
        } catch (error) {
            console.error("Razorpay API Error:", error.error || error);
            console.log("Falling back to mocked payout response for prototype...");
        }
    }

    // Mock response fallback
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
        id: "pout_" + Math.random().toString(36).substring(7),
        entity: "payout",
        fund_account_id: "fa_" + accountNumber,
        amount: amount * 100,
        currency: "INR",
        status: "processing (mocked)",
        purpose: "insurance_claim",
        created_at: Math.floor(Date.now() / 1000)
    };
}

// Format date nicely
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return seconds + " sec ago";
    if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
    return Math.floor(seconds / 3600) + " hr ago";
};

// POST: Submit new claim
app.post('/api/claims', upload.single('evidence'), async (req, res) => {
    try {
        const { name, vehicle, claimId, description, accountNumber = '1234567890' } = req.body;
        
        if (!description || !name || !vehicle || !claimId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Evidence image is required' });
        }

        const imagePath = path.join(uploadDir, imageFile.filename);

        console.log(`Analyzing claim ${claimId} with Gemini...`);
        const analysis = await analyzeClaim(description, imagePath);
        console.log("Analysis Complete:", analysis);

        // Map to frontend structure
        const newClaim = {
            id: 'id-' + Math.floor(1000 + Math.random() * 9000),
            name,
            vehicle,
            claimId,
            description,
            image: `http://localhost:3001/uploads/${imageFile.filename}`, // URL for frontend
            risk: analysis.riskScore,
            reasoning: analysis.reasoning,
            rawDecision: analysis.decision,
            status: analysis.decision === 'AUTO_PAY' ? 'Approved' : (analysis.riskScore > 75 ? 'Flagged' : 'Pending Review'),
            submittedAt: new Date().toISOString(), // Keep raw date for mapping to 'submitted' later
            payoutStatus: 'Not Initiated'
        };

        // If Auto-Pay, trigger Razorpay Payout instantly
        if (newClaim.status === 'Approved') {
            const payoutResult = await initiateRazorpayPayout(5000, accountNumber);
            newClaim.payoutDetails = payoutResult;
            newClaim.payoutStatus = 'Processing';
        }

        // Prepend to show newest first
        claimsDB.unshift(newClaim);
        
        res.status(201).json({
            message: 'Claim processed',
            claim: newClaim
        });

    } catch (error) {
        console.error("Error processing claim:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET: Fetch claims for Agent Dashboard
app.get('/api/claims', (req, res) => {
    // Map the DB structure to match exactly what the frontend `Claim` type expects
    const mappedClaims = claimsDB.map(c => ({
        id: c.id,
        name: c.name,
        vehicle: c.vehicle,
        claimId: c.claimId,
        submitted: timeAgo(c.submittedAt),
        risk: c.risk,
        status: c.status,
        description: c.description,
        image: c.image,
        reasoning: c.reasoning,
        payoutStatus: c.payoutStatus
    }));
    res.json(mappedClaims);
});

// PATCH: Manual Agent Approval / Rejection
app.patch('/api/claims/:id/status', async (req, res) => {
    try {
        const claimId = req.params.id;
        const { status, accountNumber = '1234567890' } = req.body;
        
        const claimIndex = claimsDB.findIndex(c => c.id === claimId);
        if (claimIndex === -1) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        claimsDB[claimIndex].status = status;

        // If agent manually approves, trigger the payout!
        if (status === 'Approved') {
            const payoutResult = await initiateRazorpayPayout(5000, accountNumber);
            claimsDB[claimIndex].payoutDetails = payoutResult;
            claimsDB[claimIndex].payoutStatus = 'Processing';
        }

        res.json({ message: 'Claim updated', claim: claimsDB[claimIndex] });
    } catch (error) {
        console.error("Error updating claim:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST: Simulate Razorpay Webhook
app.post('/api/webhooks/razorpay', (req, res) => {
    try {
        const { claimId, event } = req.body;
        const claim = claimsDB.find(c => c.id === claimId);
        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }
        
        if (event === 'payout.processed') {
            claim.payoutStatus = 'Processed';
        } else if (event === 'payout.failed') {
            claim.payoutStatus = 'Failed';
        }

        console.log(`[Webhook] Received event ${event} for claim ${claimId}`);
        res.json({ message: 'Webhook received successfully', claim });
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
