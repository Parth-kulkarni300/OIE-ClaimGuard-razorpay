require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI, Type, Schema } = require('@google/genai');
const Razorpay = require('razorpay');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize AI and Razorpay
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let rzp;
if (process.env.RAZORPAY_KEY_ID !== 'YOUR_RAZORPAY_KEY_ID_HERE') {
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

const claimsDB = [];

/**
 * Real Agentic AI Triage Engine using Gemini Vision
 */
async function analyzeClaim(claimText, imagePath) {
    try {
        // Convert local file to base64
        const fileBytes = fs.readFileSync(imagePath);
        const base64Data = fileBytes.toString('base64');
        const mimeType = 'image/jpeg'; // Assuming jpeg for prototype

        const prompt = `You are an expert insurance fraud investigator. 
        A customer has submitted an auto insurance claim with the following description: "${claimText}"
        Analyze the provided image of the car damage. 
        Does the visual damage match the description? 
        If the damage is minor and matches the description (e.g. minor scratch), approve it for straight-through processing (AUTO_PAY).
        If the text claims severe damage ("totaled", "destroyed") but the image shows minor or no damage, flag it for INVESTIGATE.
        If the text claims minor damage but the image shows severe damage, flag it for INVESTIGATE.`;

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
                        riskScore: { type: Type.INTEGER, description: "Risk score from 0 to 100" },
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
            // Note: In a real production env, you must first create a contact and fund_account.
            // For the hackathon, if this fails due to missing fund_account setup, we catch it.
            const payout = await rzp.payouts.create({
                account_number: "2323230058348281", // Razorpay test account
                fund_account_id: "fa_" + accountNumber, // Would be dynamically created
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

    // Mock response fallback if keys are missing or API fails (e.g., fund_account not setup)
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

// Routes
app.post('/api/claims', upload.array('evidence'), async (req, res) => {
    try {
        const { description, accountNumber = '1234567890' } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const imageFile = req.files && req.files.length > 0 ? req.files[0] : null;
        if (!imageFile) {
            return res.status(400).json({ error: 'Evidence image is required' });
        }

        const imagePath = path.join(uploadDir, imageFile.filename);

        // 1. Analyze via Agentic AI (Gemini Vision)
        console.log("Analyzing claim with Gemini...");
        const analysis = await analyzeClaim(description, imagePath);
        console.log("Analysis Complete:", analysis);

        const newClaim = {
            id: 'CLM-' + Math.floor(1000 + Math.random() * 9000),
            description,
            evidenceFiles: [imageFile.filename],
            analysis,
            status: analysis.decision === 'AUTO_PAY' ? 'PROCESSING_PAYOUT' : 'PENDING_INVESTIGATION',
            createdAt: new Date().toISOString()
        };

        // 2. If Auto-Pay, trigger Razorpay Payout
        if (analysis.decision === 'AUTO_PAY') {
            const payoutResult = await initiateRazorpayPayout(5000, accountNumber); // Example fixed amount for minor scratch
            newClaim.payoutDetails = payoutResult;
            newClaim.status = 'PAYOUT_INITIATED';
        }

        claimsDB.push(newClaim);
        
        res.status(201).json({
            message: 'Claim processed',
            claim: newClaim
        });

    } catch (error) {
        console.error("Error processing claim:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/claims', (req, res) => {
    res.json(claimsDB);
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
